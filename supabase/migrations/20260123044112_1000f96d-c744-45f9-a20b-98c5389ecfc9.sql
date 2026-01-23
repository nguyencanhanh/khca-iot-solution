-- Tighten RLS to reduce company-wide data exposure

-- PROFILES: remove broad SELECT policy, keep admin + self
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- TASKS: remove broad SELECT, restrict to admin/manager or creator/assignee
DROP POLICY IF EXISTS "Authenticated users can view all tasks" ON public.tasks;

CREATE POLICY "Users can view relevant tasks"
ON public.tasks
FOR SELECT
USING (
  is_admin_or_manager(auth.uid())
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.id = tasks.assignee_id
  )
);

-- INVENTORY: remove broad SELECT, restrict to admin/manager or technical
DROP POLICY IF EXISTS "Authenticated users can view all inventory" ON public.inventory_items;

CREATE POLICY "Staff can view inventory"
ON public.inventory_items
FOR SELECT
USING (
  is_admin_or_manager(auth.uid())
  OR has_role(auth.uid(), 'technical'::app_role)
);

-- PROJECTS: remove broad SELECT, restrict to admin/manager or same department
DROP POLICY IF EXISTS "Everyone can view projects" ON public.projects;

CREATE POLICY "Users can view department projects"
ON public.projects
FOR SELECT
USING (
  is_admin_or_manager(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.department_id = projects.department_id
  )
);

-- DEPARTMENTS: remove public SELECT, restrict to authenticated users
DROP POLICY IF EXISTS "Everyone can view departments" ON public.departments;

CREATE POLICY "Authenticated users can view departments"
ON public.departments
FOR SELECT
USING (auth.uid() IS NOT NULL);
