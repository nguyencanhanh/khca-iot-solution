-- Fix infinite recursion between documents <-> document_permissions RLS

-- 1) Helper function to check document ownership WITHOUT triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_document_owner(_doc_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid;
BEGIN
  -- SECURITY DEFINER bypasses RLS, but we still only return boolean.
  SELECT d.uploaded_by INTO _owner
  FROM public.documents d
  WHERE d.id = _doc_id;

  RETURN _owner = _user_id;
END;
$$;

-- Lock down function privileges
REVOKE ALL ON FUNCTION public.is_document_owner(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_document_owner(uuid, uuid) TO authenticated;


-- 2) Replace document_permissions policies to avoid selecting from documents inside policy
DROP POLICY IF EXISTS "Document owner or admin can view permissions" ON public.document_permissions;
DROP POLICY IF EXISTS "Document owner or admin can manage permissions" ON public.document_permissions;

-- View permissions: admin/manager, doc owner, or a user who already has permission row
CREATE POLICY "Users can view relevant document permissions"
ON public.document_permissions
FOR SELECT
USING (
  is_admin_or_manager(auth.uid())
  OR public.is_document_owner(document_permissions.document_id, auth.uid())
  OR document_permissions.user_id = auth.uid()
  OR document_permissions.role = public.get_user_role(auth.uid())
);

-- Manage permissions (insert/update/delete): admin/manager or doc owner
CREATE POLICY "Admins/managers or owners can manage document permissions"
ON public.document_permissions
FOR ALL
USING (
  is_admin_or_manager(auth.uid())
  OR public.is_document_owner(document_permissions.document_id, auth.uid())
)
WITH CHECK (
  is_admin_or_manager(auth.uid())
  OR public.is_document_owner(document_permissions.document_id, auth.uid())
);


-- 3) Helpful indexes for permission checks
CREATE INDEX IF NOT EXISTS idx_document_permissions_document_id ON public.document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_user_id ON public.document_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_role ON public.document_permissions(role);
