-- Departments as a tree (phòng lớn/phòng nhỏ)
-- 1) departments: add parent_id to support 2-level hierarchy (and can be extended)
ALTER TABLE public.departments
ADD COLUMN IF NOT EXISTS parent_id uuid NULL;

-- FK to itself; restrict delete if has children
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'departments_parent_id_fkey'
  ) THEN
    ALTER TABLE public.departments
    ADD CONSTRAINT departments_parent_id_fkey
    FOREIGN KEY (parent_id) REFERENCES public.departments(id)
    ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON public.departments(parent_id);

-- Prevent duplicate names under same parent (case-insensitive)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='uq_departments_parent_lower_name'
  ) THEN
    CREATE UNIQUE INDEX uq_departments_parent_lower_name
    ON public.departments (COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));
  END IF;
END $$;


-- 2) documents: add sub_department_id (points to a child department)
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS sub_department_id uuid NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documents_sub_department_id_fkey'
  ) THEN
    ALTER TABLE public.documents
    ADD CONSTRAINT documents_sub_department_id_fkey
    FOREIGN KEY (sub_department_id) REFERENCES public.departments(id)
    ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_documents_sub_department_id ON public.documents(sub_department_id);


-- 3) profiles: add sub_department_id for defaulting upload + filtering
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS sub_department_id uuid NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_sub_department_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_sub_department_id_fkey
    FOREIGN KEY (sub_department_id) REFERENCES public.departments(id)
    ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_sub_department_id ON public.profiles(sub_department_id);


-- 4) Validation triggers (avoid CHECK constraints)
-- Ensure sub_department belongs to selected department (2-level: child.parent_id == department_id)
CREATE OR REPLACE FUNCTION public.validate_department_hierarchy()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _parent uuid;
BEGIN
  -- If sub_department_id is set, department_id must be set
  IF NEW.sub_department_id IS NOT NULL AND NEW.department_id IS NULL THEN
    RAISE EXCEPTION 'department_id is required when sub_department_id is set';
  END IF;

  IF NEW.sub_department_id IS NOT NULL THEN
    SELECT parent_id INTO _parent
    FROM public.departments
    WHERE id = NEW.sub_department_id;

    IF _parent IS NULL THEN
      RAISE EXCEPTION 'sub_department_id must be a child department (parent_id is null)';
    END IF;

    IF _parent <> NEW.department_id THEN
      RAISE EXCEPTION 'sub_department_id must belong to department_id';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach triggers to documents and profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_documents_validate_department_hierarchy'
  ) THEN
    CREATE TRIGGER trg_documents_validate_department_hierarchy
    BEFORE INSERT OR UPDATE OF department_id, sub_department_id
    ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_department_hierarchy();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_profiles_validate_department_hierarchy'
  ) THEN
    CREATE TRIGGER trg_profiles_validate_department_hierarchy
    BEFORE INSERT OR UPDATE OF department_id, sub_department_id
    ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_department_hierarchy();
  END IF;
END $$;


-- 5) RLS policies: keep existing ones; ensure departments are manageable by admin/manager and viewable by authenticated.
-- (No changes needed if already present, but ensure enabled)
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
