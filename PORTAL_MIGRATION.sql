-- ═══════════════════════════════════════════════════════════════
--  SUPABASE MIGRATION: Employee & Driver Portals
--  Run this in Supabase SQL Editor after the initial setup
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Add user_id column to employees (for self-registration) ──
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email    TEXT,
  ADD COLUMN IF NOT EXISTS phone    TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS office   TEXT DEFAULT 'Main Campus',
  ADD COLUMN IF NOT EXISTS pickup_time TEXT,
  ADD COLUMN IF NOT EXISTS drop_time   TEXT;

-- ── 2. Add user_id column to drivers (for portal login) ──
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email   TEXT,
  ADD COLUMN IF NOT EXISTS rating  NUMERIC(2,1) DEFAULT 4.5;

-- ── 3. Trips table (driver trip tracking) ──
CREATE TABLE IF NOT EXISTS trips (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id  TEXT REFERENCES drivers(id) ON DELETE CASCADE,
  route_id   TEXT REFERENCES routes(id)  ON DELETE SET NULL,
  status     TEXT NOT NULL DEFAULT 'in_progress'
               CHECK (status IN ('in_progress','completed','cancelled')),
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at   TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 4. Trip pickups (which passengers were picked up) ──
CREATE TABLE IF NOT EXISTS trip_pickups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID REFERENCES trips(id) ON DELETE CASCADE,
  employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
  picked_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trip_id, employee_id)
);

-- ── 5. Row Level Security ──

-- Employees can read/update their own row
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "employees_self_read"  ON employees
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "employees_self_insert" ON employees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "employees_self_update" ON employees
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin (service role / admin_profiles) can read all employees
CREATE POLICY IF NOT EXISTS "employees_admin_all" ON employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles WHERE id = auth.uid()
    )
  );

-- Drivers can read/update their own row
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "drivers_self_read" ON drivers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "drivers_admin_all" ON drivers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

-- Trips: drivers can CRUD their own trips
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "trips_driver_own" ON trips
  FOR ALL USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "trips_admin_all" ON trips
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

-- Trip pickups: drivers can manage pickups for their own trips
ALTER TABLE trip_pickups ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "pickups_driver_own" ON trip_pickups
  FOR ALL USING (
    trip_id IN (
      SELECT t.id FROM trips t
      JOIN drivers d ON t.driver_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- ── 6. Indexes ──
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id   ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id   ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status      ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trip_pickups_trip ON trip_pickups(trip_id);

-- ── 7. Allow employee portal to read routes + drivers + cars ──
-- (employees need to read their assigned route details)
CREATE POLICY IF NOT EXISTS "routes_employee_read" ON routes
  FOR SELECT USING (
    id IN (SELECT route_id FROM employees WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

-- ── DONE ──
-- After running this migration:
-- 1. Go to Authentication > Users and create driver accounts
-- 2. Set user_id on each driver row to match the auth user
-- 3. Share /?portal=employee link with employees for self-registration
-- 4. Share /?portal=driver link with drivers for their portal

-- ── Geo coordinates for employee pickup location ──────────────
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS lat  NUMERIC(10,6),
  ADD COLUMN IF NOT EXISTS lng  NUMERIC(10,6);
