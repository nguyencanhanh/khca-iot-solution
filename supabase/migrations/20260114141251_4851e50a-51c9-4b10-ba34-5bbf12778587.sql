-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'technical', 'accounting', 'manager');

-- Create enum for document permissions
CREATE TYPE public.doc_permission AS ENUM ('view', 'edit');

-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_type TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document_permissions table for granular access control
CREATE TABLE public.document_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role,
  permission doc_permission NOT NULL DEFAULT 'view',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_or_role CHECK (user_id IS NOT NULL OR role IS NOT NULL)
);

-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Enable RLS on all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user has any admin-level role
CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'manager')
  )
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for departments (everyone can view, admin/manager can edit)
CREATE POLICY "Everyone can view departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Manager can manage departments" ON public.departments FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));

-- RLS Policies for projects
CREATE POLICY "Everyone can view projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Manager can manage projects" ON public.projects FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles (only admin can view/manage)
CREATE POLICY "Admin can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for documents
CREATE POLICY "Users can view public documents" ON public.documents FOR SELECT TO authenticated USING (is_public = true);
CREATE POLICY "Users can view documents with permission" ON public.documents FOR SELECT TO authenticated 
  USING (
    uploaded_by = auth.uid() OR
    public.is_admin_or_manager(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.document_permissions dp
      WHERE dp.document_id = id AND (dp.user_id = auth.uid() OR dp.role = public.get_user_role(auth.uid()))
    )
  );
CREATE POLICY "Users can upload documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Users can update own documents or with edit permission" ON public.documents FOR UPDATE TO authenticated 
  USING (
    uploaded_by = auth.uid() OR
    public.is_admin_or_manager(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.document_permissions dp
      WHERE dp.document_id = id AND dp.permission = 'edit' AND (dp.user_id = auth.uid() OR dp.role = public.get_user_role(auth.uid()))
    )
  );
CREATE POLICY "Admin/Manager/Owner can delete documents" ON public.documents FOR DELETE TO authenticated 
  USING (uploaded_by = auth.uid() OR public.is_admin_or_manager(auth.uid()));

-- RLS Policies for document_permissions
CREATE POLICY "Document owner or admin can view permissions" ON public.document_permissions FOR SELECT TO authenticated 
  USING (
    public.is_admin_or_manager(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.uploaded_by = auth.uid())
  );
CREATE POLICY "Document owner or admin can manage permissions" ON public.document_permissions FOR ALL TO authenticated 
  USING (
    public.is_admin_or_manager(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.uploaded_by = auth.uid())
  );

-- RLS Policies for activity_logs
CREATE POLICY "Admin can view all logs" ON public.activity_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own logs" ON public.activity_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Storage policies for documents bucket
CREATE POLICY "Authenticated users can upload documents" ON storage.objects FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Users can view documents they have access to" ON storage.objects FOR SELECT TO authenticated 
  USING (bucket_id = 'documents');
CREATE POLICY "Users can delete their own documents" ON storage.objects FOR DELETE TO authenticated 
  USING (bucket_id = 'documents');

-- Trigger function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), NEW.email);
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default departments
INSERT INTO public.departments (name, description) VALUES
  ('Kỹ thuật', 'Phòng kỹ thuật và R&D'),
  ('Kế toán', 'Phòng kế toán tài chính'),
  ('Kinh doanh', 'Phòng kinh doanh'),
  ('Hành chính', 'Phòng hành chính nhân sự'),
  ('Dự án', 'Phòng quản lý dự án');

-- Insert sample projects
INSERT INTO public.projects (name, code, status) VALUES
  ('Bình Dương - Cấp nước', 'BD-01', 'active'),
  ('Đà Nẵng - Giám sát', 'DN-03', 'active'),
  ('Hà Nội - Thoát nước', 'HN-02', 'active'),
  ('R&D - Gateway G5', 'RD-05', 'active');