-- ═══════════════════════════════════════════════════════════════
--  TRIPS_MIGRATION.sql
--  Run this in Supabase SQL Editor
--  Creates trip management tables + RLS policies
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Drop old trips / trip_pickups if they exist ───────────
DROP TABLE IF EXISTS public.trip_pickups CASCADE;
-- Keep trips table but we'll recreate with new schema
DROP TABLE IF EXISTS public.trips CASCADE;
DROP TABLE IF EXISTS public.trip_employees CASCADE;

-- ── 2. Remove route-driver/car direct link (routes are now trip-agnostic)
-- Drop dependent views first, then remove columns
DROP VIEW IF EXISTS public.vw_routes_detail CASCADE;
DROP VIEW IF EXISTS public.vw_driver_availability CASCADE;
DROP VIEW IF EXISTS public.vw_route_summary CASCADE;

ALTER TABLE public.routes
  DROP COLUMN IF EXISTS driver_id CASCADE,
  DROP COLUMN IF EXISTS car_id CASCADE;

-- ── 3. trips table ────────────────────────────────────────────
CREATE TABLE public.trips (
  id            TEXT        PRIMARY KEY DEFAULT ('T' || upper(substring(replace(gen_random_uuid()::text,'-',''),1,6))),
  route_id      TEXT        REFERENCES public.routes(id)  ON DELETE SET NULL,
  driver_id     TEXT        REFERENCES public.drivers(id) ON DELETE SET NULL,
  car_id        TEXT        REFERENCES public.cars(id)    ON DELETE SET NULL,
  status        TEXT        NOT NULL DEFAULT 'scheduled'
                            CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
  shift_label   TEXT,
  scheduled_at  TIMESTAMPTZ,
  started_at    TIMESTAMPTZ,
  ended_at      TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. trip_employees junction (replaces trip_pickups) ───────
CREATE TABLE public.trip_employees (
  id             UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id        TEXT   NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  employee_id    TEXT   NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  pickup_status  TEXT   NOT NULL DEFAULT 'pending'
                        CHECK (pickup_status IN ('pending','picked','dropped')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trip_id, employee_id)
);

-- ── 5. Index for fast driver trip lookup ─────────────────────
CREATE INDEX IF NOT EXISTS idx_trips_driver   ON public.trips(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_status   ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_te_employee    ON public.trip_employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_te_trip        ON public.trip_employees(trip_id);

-- ── 6. RLS ────────────────────────────────────────────────────
ALTER TABLE public.trips          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_employees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "trips_admin_all" ON public.trips;
DROP POLICY IF EXISTS "trip_employees_admin_all" ON public.trip_employees;
DROP POLICY IF EXISTS "trips_driver_read" ON public.trips;
DROP POLICY IF EXISTS "trips_driver_update" ON public.trips;
DROP POLICY IF EXISTS "trip_employees_driver_update" ON public.trip_employees;
DROP POLICY IF EXISTS "trip_employees_driver_read" ON public.trip_employees;
DROP POLICY IF EXISTS "trip_employees_self_read" ON public.trip_employees;
DROP POLICY IF EXISTS "trips_employee_read" ON public.trips;

-- Admins can do everything
CREATE POLICY "trips_admin_all" ON public.trips
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "trip_employees_admin_all" ON public.trip_employees
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- Drivers can see their own trips
CREATE POLICY "trips_driver_read" ON public.trips
  FOR SELECT USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

-- Drivers can update trip status (start/end)
CREATE POLICY "trips_driver_update" ON public.trips
  FOR UPDATE USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

-- Drivers can update pickup status on their trip's employees
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

-- Employees can see their own trip_employees rows (and join to trips)
CREATE POLICY "trip_employees_self_read" ON public.trip_employees
  FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  );

CREATE POLICY "trips_employee_read" ON public.trips
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trip_employees te
      JOIN public.employees e ON te.employee_id = e.id
      WHERE te.trip_id = id AND e.user_id = auth.uid()
    )
  );

-- ── 7. Realtime for live tracking ────────────────────────────
-- Run in Supabase Dashboard → Database → Replication:
-- Enable tracking_events, trips, trip_employees

-- ── DONE ─────────────────────────────────────────────────────
