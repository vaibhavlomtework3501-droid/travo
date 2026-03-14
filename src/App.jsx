import { useEffect } from "react";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import LoginPage      from "./components/LoginPage";
import DashboardShell from "./components/DashboardShell";
import EmployeePortal from "./pages/EmployeePortal";
import DriverPortal   from "./pages/DriverPortal";

/* Detect ?portal=employee  or  ?portal=driver in URL */
function getPortal() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("portal");
}

function Inner() {
  const { profile, loading } = useAuth();
  const portal = getPortal();

  // ── Portal routes (no admin auth required) ──────────────────
  if (portal === "employee") return <EmployeePortal />;
  if (portal === "driver")   return <DriverPortal />;

  // ── Admin dashboard ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-sm text-slate-400 font-medium">Loading ETRAVO…</p>
        </div>
      </div>
    );
  }

  if (!profile) return <LoginPage />;
  return <DashboardShell user={profile} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Inner />
    </AuthProvider>
  );
}
