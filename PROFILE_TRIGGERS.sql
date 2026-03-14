-- ═══════════════════════════════════════════════════════════════
--  PROFILE_TRIGGERS.sql
--  Run this in Supabase SQL Editor
--  Auto-creates employee/driver profile rows on auth signup
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Function: auto-insert employee row on signup ──────────
-- Fires when a new user signs up via the employee portal
-- The portal passes user metadata: name, phone, department, etc.

CREATE OR REPLACE FUNCTION public.handle_employee_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  emp_id TEXT;
BEGIN
  -- Only run if the user signed up via the employee portal
  -- (detected by raw_user_meta_data containing 'portal': 'employee')
  IF (NEW.raw_user_meta_data->>'portal') = 'employee' THEN
    emp_id := 'EMP' || upper(substring(replace(NEW.id::text, '-', ''), 1, 5));

    INSERT INTO public.employees (
      id, user_id, name, email, phone,
      department, office, shift, address,
      status, route_id
    ) VALUES (
      emp_id,
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', 'New Employee'),
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'department',
      COALESCE(NEW.raw_user_meta_data->>'office', 'Main Campus'),
      COALESCE(NEW.raw_user_meta_data->>'shift', '09:00 AM'),
      NEW.raw_user_meta_data->>'address',
      'pending',
      NULL
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_employee_signup ON auth.users;
CREATE TRIGGER on_employee_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_employee_signup();


-- ── 2. Function: auto-insert driver row on signup ────────────
-- Fires when an admin creates a driver auth account
-- Pass metadata: portal='driver', name, phone, license

CREATE OR REPLACE FUNCTION public.handle_driver_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  drv_id TEXT;
BEGIN
  IF (NEW.raw_user_meta_data->>'portal') = 'driver' THEN
    drv_id := 'D' || upper(substring(replace(NEW.id::text, '-', ''), 1, 4));

    INSERT INTO public.drivers (
      id, user_id, name, email, phone, license, status, rating
    ) VALUES (
      drv_id,
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', 'New Driver'),
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      COALESCE(NEW.raw_user_meta_data->>'license', 'PENDING'),
      'available',
      4.5
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_driver_signup ON auth.users;
CREATE TRIGGER on_driver_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_driver_signup();


-- ── 3. Helper view: see all users with their profile type ────
CREATE OR REPLACE VIEW public.vw_all_portal_users AS
  SELECT
    u.id        AS auth_id,
    u.email,
    u.created_at,
    'employee'  AS portal,
    e.id        AS profile_id,
    e.name,
    e.status
  FROM auth.users u
  JOIN public.employees e ON e.user_id = u.id

  UNION ALL

  SELECT
    u.id,
    u.email,
    u.created_at,
    'driver',
    d.id,
    d.name,
    d.status
  FROM auth.users u
  JOIN public.drivers d ON d.user_id = u.id;


-- ── 4. RLS: employees can insert their own row ───────────────
-- (needed when the trigger approach isn't used and portal inserts directly)
DROP POLICY IF EXISTS "employees_self_insert" ON public.employees;
CREATE POLICY "employees_self_insert" ON public.employees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "employees_self_read" ON public.employees;
CREATE POLICY "employees_self_read" ON public.employees
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "employees_self_update" ON public.employees;
CREATE POLICY "employees_self_update" ON public.employees
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin can do everything
DROP POLICY IF EXISTS "employees_admin_all" ON public.employees;
CREATE POLICY "employees_admin_all" ON public.employees
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- Drivers: self read
DROP POLICY IF EXISTS "drivers_self_read" ON public.drivers;
CREATE POLICY "drivers_self_read" ON public.drivers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "drivers_admin_all" ON public.drivers;
CREATE POLICY "drivers_admin_all" ON public.drivers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- Routes: employees can read their own assigned route
DROP POLICY IF EXISTS "routes_employee_read" ON public.routes;
CREATE POLICY "routes_employee_read" ON public.routes
  FOR SELECT USING (
    id IN (SELECT route_id FROM public.employees WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
    OR id IN (SELECT id FROM public.routes WHERE driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    ))
  );

-- Cars: drivers can read their assigned car
DROP POLICY IF EXISTS "cars_driver_read" ON public.cars;
CREATE POLICY "cars_driver_read" ON public.cars
  FOR SELECT USING (
    id IN (SELECT car_id FROM public.drivers WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- ── DONE ──
