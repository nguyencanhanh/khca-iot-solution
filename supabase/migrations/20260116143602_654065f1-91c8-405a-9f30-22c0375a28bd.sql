-- ==========================================
-- FIX EXISTING RLS POLICY BUGS
-- ==========================================

-- Fix documents SELECT policy (dp.document_id = dp.id should be dp.document_id = documents.id)
DROP POLICY IF EXISTS "Users can view documents with permission" ON public.documents;
CREATE POLICY "Users can view documents with permission" 
ON public.documents 
FOR SELECT 
USING (
  (uploaded_by = auth.uid()) 
  OR is_admin_or_manager(auth.uid()) 
  OR (EXISTS ( 
    SELECT 1 FROM document_permissions dp
    WHERE (dp.document_id = documents.id) 
    AND ((dp.user_id = auth.uid()) OR (dp.role = get_user_role(auth.uid())))
  ))
);

-- Fix documents UPDATE policy
DROP POLICY IF EXISTS "Users can update own documents or with edit permission" ON public.documents;
CREATE POLICY "Users can update own documents or with edit permission" 
ON public.documents 
FOR UPDATE 
USING (
  (uploaded_by = auth.uid()) 
  OR is_admin_or_manager(auth.uid()) 
  OR (EXISTS ( 
    SELECT 1 FROM document_permissions dp
    WHERE (dp.document_id = documents.id) 
    AND (dp.permission = 'edit'::doc_permission) 
    AND ((dp.user_id = auth.uid()) OR (dp.role = get_user_role(auth.uid())))
  ))
);

-- Fix profiles policy to only allow authenticated users to view profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- ==========================================
-- CREATE TASKS TABLE
-- ==========================================
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE public.task_priority AS ENUM ('high', 'medium', 'low');

CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  deadline DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Authenticated users can view all tasks" 
ON public.tasks 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin/Manager can manage all tasks" 
ON public.tasks 
FOR ALL 
USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Users can create tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update assigned tasks" 
ON public.tasks 
FOR UPDATE 
USING (
  auth.uid() = created_by 
  OR (assignee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Creators can delete own tasks" 
ON public.tasks 
FOR DELETE 
USING (auth.uid() = created_by OR is_admin_or_manager(auth.uid()));

-- ==========================================
-- CREATE INVENTORY TABLE
-- ==========================================
CREATE TYPE public.inventory_status AS ENUM ('in_stock', 'deployed', 'deploying', 'maintenance');

CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  serial TEXT NOT NULL UNIQUE,
  firmware TEXT,
  status inventory_status NOT NULL DEFAULT 'in_stock',
  location TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory
CREATE POLICY "Authenticated users can view all inventory" 
ON public.inventory_items 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin/Manager can manage all inventory" 
ON public.inventory_items 
FOR ALL 
USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Technical staff can manage inventory" 
ON public.inventory_items 
FOR ALL 
USING (has_role(auth.uid(), 'technical'));

-- ==========================================
-- CREATE TRIGGERS FOR updated_at
-- ==========================================
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- INSERT SAMPLE DATA
-- ==========================================
-- Insert sample inventory items
INSERT INTO public.inventory_items (name, serial, firmware, status, location, created_by) VALUES
  ('AquaSense Pro', 'ASP-2024-0892', 'v2.3.1', 'in_stock', 'Kho HCM', '00000000-0000-0000-0000-000000000000'),
  ('FlowMaster 5000', 'FM5-2024-0156', 'v1.8.0', 'deployed', 'Dự án BD-01', '00000000-0000-0000-0000-000000000000'),
  ('IoT Gateway G4', 'GTW-2024-0423', 'v2.5.0', 'deploying', 'Dự án DN-03', '00000000-0000-0000-0000-000000000000'),
  ('AquaSense Pro', 'ASP-2024-0893', 'v2.3.1', 'in_stock', 'Kho HN', '00000000-0000-0000-0000-000000000000'),
  ('FlowMaster 5000', 'FM5-2024-0157', 'v1.8.0', 'maintenance', 'Xưởng HCM', '00000000-0000-0000-0000-000000000000'),
  ('IoT Gateway G4', 'GTW-2024-0424', 'v2.5.0', 'deployed', 'Dự án HN-02', '00000000-0000-0000-0000-000000000000'),
  ('AquaSense Pro', 'ASP-2024-0894', 'v2.3.0', 'deployed', 'Dự án BD-01', '00000000-0000-0000-0000-000000000000'),
  ('FlowMaster 5000', 'FM5-2024-0158', 'v1.8.0', 'in_stock', 'Kho HCM', '00000000-0000-0000-0000-000000000000'),
  ('AquaSense Basic', 'ASB-2024-0234', 'v1.2.0', 'in_stock', 'Kho HCM', '00000000-0000-0000-0000-000000000000'),
  ('IoT Gateway G4', 'GTW-2024-0425', 'v2.4.2', 'maintenance', 'Xưởng HN', '00000000-0000-0000-0000-000000000000');

-- Insert sample tasks
INSERT INTO public.tasks (title, description, status, priority, deadline, created_by) VALUES
  ('Triển khai trạm giám sát Bình Dương', 'Lắp đặt và cấu hình 5 trạm giám sát mới', 'in_progress', 'high', '2024-12-20', '00000000-0000-0000-0000-000000000000'),
  ('Bảo trì FlowMaster #234', 'Kiểm tra và thay thế cảm biến', 'todo', 'medium', '2024-12-22', '00000000-0000-0000-0000-000000000000'),
  ('Cập nhật firmware Gateway G4', 'Nâng cấp firmware lên phiên bản 2.5.1', 'done', 'low', '2024-12-15', '00000000-0000-0000-0000-000000000000'),
  ('Báo cáo dự án Q4/2024', 'Tổng hợp và phân tích kết quả Q4', 'in_progress', 'high', '2024-12-25', '00000000-0000-0000-0000-000000000000'),
  ('Đào tạo nhân sự mới', 'Hướng dẫn quy trình và công cụ', 'todo', 'medium', '2024-12-28', '00000000-0000-0000-0000-000000000000'),
  ('Khảo sát Đà Nẵng', 'Khảo sát vị trí lắp đặt trạm mới', 'todo', 'high', '2024-12-18', '00000000-0000-0000-0000-000000000000'),
  ('Hoàn thiện tài liệu API', 'Cập nhật documentation API v3', 'in_progress', 'medium', '2024-12-21', '00000000-0000-0000-0000-000000000000'),
  ('Review code sprint 12', 'Kiểm tra và phê duyệt code', 'done', 'medium', '2024-12-14', '00000000-0000-0000-0000-000000000000');