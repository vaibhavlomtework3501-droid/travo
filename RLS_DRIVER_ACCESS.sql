-- Allow employees to read driver details (simplified to avoid recursion)
-- Run this in Supabase SQL Editor

-- Drop if exists (safe to re-run)
DROP POLICY IF EXISTS "drivers_employee_trip_read" ON public.drivers;

-- Create the policy (allows employees to read all drivers, UI filters to relevant ones)
CREATE POLICY "drivers_employee_read" ON public.drivers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid())
  );
