-- Fix for infinite recursion in RLS policies
-- Run this in Supabase SQL Editor

-- Drop the problematic policies
DROP POLICY IF EXISTS "trip_employees_driver_update" ON public.trip_employees;
DROP POLICY IF EXISTS "trip_employees_driver_read" ON public.trip_employees;
DROP POLICY IF EXISTS "trips_employee_read" ON public.trips;

-- Recreate with EXISTS instead of IN subqueries to avoid recursion
CREATE POLICY "trip_employees_driver_update" ON public.trip_employees
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      JOIN public.drivers d ON t.driver_id = d.id
      WHERE t.id = trip_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "trip_employees_driver_read" ON public.trip_employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      JOIN public.drivers d ON t.driver_id = d.id
      WHERE t.id = trip_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "trips_employee_read" ON public.trips
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trip_employees te
      WHERE te.trip_id = id
      AND te.employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    )
  );