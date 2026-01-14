-- Fix permissive RLS policy for activity_logs
-- Replace the overly permissive INSERT policy with a more restrictive one
DROP POLICY IF EXISTS "System can insert logs" ON public.activity_logs;

-- Users can only insert logs for themselves
CREATE POLICY "Users can insert own activity logs" ON public.activity_logs 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);