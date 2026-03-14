# ETRAVO — Supabase Integration Guide

## What changed from the original

| File | What was done |
|------|--------------|
| `src/lib/supabase.js` | **NEW** — Supabase client singleton |
| `src/lib/db.js` | **NEW** — All database operations (employees, drivers, cars, routes, tracking, notifications) |
| `src/lib/AuthContext.jsx` | **NEW** — React context that wraps Supabase Auth |
| `src/App.jsx` | Updated — wraps app in `<AuthProvider>`, shows loading state |
| `src/components/LoginPage.jsx` | Updated — calls `supabase.auth.signInWithPassword()` instead of checking hardcoded DEMO_USERS |
| `src/components/DashboardShell.jsx` | Updated — loads all data from Supabase on mount; all mutations persist to DB |
| `src/services/gpsService.js` | Updated — subscribes to `tracking_events` Realtime channel; falls back to mock after 3s |
| `package.json` | Added `@supabase/supabase-js` dependency |
| `.env.example` | **NEW** — template for environment variables |
| `.env.local` | **NEW** — your actual secrets (git-ignored) |

---

## Setup Steps

### 1. Run the schema in Supabase

1. Open your Supabase project → **SQL Editor**
2. Paste the contents of `supabase_schema_v2.sql` and click **Run**
3. This creates all tables, views, RLS policies, triggers, and seed data

### 2. Create Auth users

In Supabase Dashboard → **Authentication → Users → Add user**:

| Email | Password | Notes |
|-------|----------|-------|
| `admin@etravo.in` | *(choose one)* | Super Admin |
| `manager@etravo.in` | *(choose one)* | Fleet Manager |
| `ops@etravo.in` | *(choose one)* | Operations Lead |

After creating each user, insert a matching row in `admin_profiles`:
```sql
-- Run once per user after creating them in Auth
INSERT INTO public.admin_profiles (id, name, role, avatar)
VALUES (
  '<paste UUID from Auth user>',
  'Admin User',
  'Super Admin',
  'A'
);
```

### 3. Add your Supabase keys to `.env.local`

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

Get these from: **Supabase Dashboard → Project Settings → API**

### 4. Install dependencies and run

```bash
npm install
npm run dev
```

---

## Live GPS Tracking

The GPS service automatically subscribes to `tracking_events` Realtime updates.

To send real location from a driver's device:
```js
import { publishLocation } from "./src/services/gpsService";

navigator.geolocation.watchPosition(pos => {
  publishLocation(
    "D001",                      // driver id
    "R01",                       // route id
    pos.coords.latitude,
    pos.coords.longitude,
    (pos.coords.speed || 0) * 3.6,  // m/s → km/h
    pos.coords.heading || 0
  );
}, null, { enableHighAccuracy: true, maximumAge: 3000 });
```

If no real pings arrive within 3 seconds, the map falls back to the mock simulation automatically (great for demos).

---

## Architecture Overview

```
App
└── AuthProvider (Supabase Auth session)
    └── DashboardShell
        ├── loads data via db.js on mount
        ├── passes state + DB-aware setters to pages
        └── Pages (PageBoarding, PageDrivers, etc.)
            └── call setEmp/setDrivers/etc. → persists to Supabase
```

All database calls go through `src/lib/db.js`. If you need to change a query, it's all in one place.
