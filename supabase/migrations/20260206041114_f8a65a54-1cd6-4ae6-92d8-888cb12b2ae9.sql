-- Drop old trigger and function
DROP TRIGGER IF EXISTS trg_documents_validate_department_hierarchy ON public.documents;
DROP TRIGGER IF EXISTS trg_profiles_validate_department_hierarchy ON public.profiles;
DROP FUNCTION IF EXISTS public.validate_department_hierarchy();

-- Create new validation function for 3-level hierarchy
CREATE OR REPLACE FUNCTION public.validate_department_hierarchy()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _parent_id uuid;
  _grandparent_id uuid;
BEGIN
  -- If sub_department_id is set, department_id must be set
  IF NEW.sub_department_id IS NOT NULL AND NEW.department_id IS NULL THEN
    RAISE EXCEPTION 'department_id is required when sub_department_id is set';
  END IF;

  IF NEW.sub_department_id IS NOT NULL THEN
    -- Get parent of sub_department
    SELECT parent_id INTO _parent_id
    FROM public.departments
    WHERE id = NEW.sub_department_id;

    -- sub_department must have a parent (not root level)
    IF _parent_id IS NULL THEN
      RAISE EXCEPTION 'sub_department_id must be a child department (not root level)';
    END IF;

    -- Check if sub_department's parent matches department_id OR is a grandchild (3-level)
    -- Case 1: sub_department is direct child of department_id (2-level)
    IF _parent_id = NEW.department_id THEN
      RETURN NEW;
    END IF;

    -- Case 2: sub_department is grandchild - its parent's parent should be department_id (3-level)
    SELECT parent_id INTO _grandparent_id
    FROM public.departments
    WHERE id = _parent_id;

    IF _grandparent_id = NEW.department_id THEN
      RETURN NEW;
    END IF;

    -- Neither case matched
    RAISE EXCEPTION 'sub_department_id must belong to the hierarchy under department_id';
  END IF;

  RETURN NEW;
END;
$$;

-- Re-create triggers
CREATE TRIGGER trg_documents_validate_department_hierarchy
  BEFORE INSERT OR UPDATE OF department_id, sub_department_id ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_department_hierarchy();

CREATE TRIGGER trg_profiles_validate_department_hierarchy
  BEFORE INSERT OR UPDATE OF department_id, sub_department_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_department_hierarchy();

-- Add helper function to get department level (0 = root, 1 = child, 2 = grandchild)
CREATE OR REPLACE FUNCTION public.get_department_level(dept_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH RECURSIVE dept_hierarchy AS (
    SELECT id, parent_id, 0 as level
    FROM public.departments
    WHERE id = dept_id
    UNION ALL
    SELECT d.id, d.parent_id, dh.level + 1
    FROM public.departments d
    INNER JOIN dept_hierarchy dh ON d.id = dh.parent_id
  )
  SELECT MAX(level) FROM dept_hierarchy;
$$;