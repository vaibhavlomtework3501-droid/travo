import { useState, useCallback, useEffect } from "react";
import { NAV_ITEMS } from "../data/constants";
import { Ic, Avt, Badge, Toast, Confirm } from "./UI";
import { useAuth } from "../lib/AuthContext";
import { db } from "../lib/db";

import PageDashboard  from "../pages/PageDashboard";
import PageBoarding   from "../pages/PageBoarding";
import PageEmployees  from "../pages/PageEmployees";
import PageRoutes     from "../pages/PageRoutes";
import PageDrivers    from "../pages/PageDrivers";
import PageCars       from "../pages/PageCars";
import PageTrips      from "../pages/PageTrips";
import PageTracking   from "../pages/PageTracking";
import { PageSchedule, PageReports, PageSettings } from "../pages/PageOthers";

/* ── ETRAVO SVG Logo Mark — stable, no external deps ─────────── */
function EtravoMark({ size = 32 }) {
  const r = Math.round(size * 0.28);
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <rect width="40" height="40" rx={r} fill="url(#et-g)"/>
      <defs>
        <linearGradient id="et-g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5b5bd6"/>
          <stop offset="1" stopColor="#0ea5e9"/>
        </linearGradient>
      </defs>
      {/* curved route path */}
      <path d="M10 28 Q14 20 20 20 Q26 20 30 12"
        stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.45"/>
      {/* destination pin */}
      <circle cx="30" cy="11" r="4.8" fill="white" opacity="0.95"/>
      <circle cx="30" cy="11" r="2.1" fill="#5b5bd6"/>
      {/* mid-path chevron */}
      <path d="M17 22.5 L20 19.5 L23 22.5"
        stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* origin dot */}
      <circle cx="10" cy="28" r="2.6" fill="white" opacity="0.75"/>
    </svg>
  );
}

/* ── Sidebar — must live at module scope to never remount ─────── */
function SideBar({ collapsed, mob, user, page, pending, navTo, setLogoutC }) {
  const show = !collapsed || mob;
  return (
    <aside
      className={`flex flex-col flex-shrink-0 overflow-hidden transition-all duration-300 relative z-10
        ${mob ? "fixed inset-y-0 left-0 w-60 z-50" : `${show ? "w-60" : "w-16"} flex`}`}
      style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--sidebar-border)" }}>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 120% 40% at 50% 0%, rgba(91,91,214,.12) 0%, transparent 60%)"
      }}/>

      {/* Logo */}
      <div className="flex items-center gap-3 h-[57px] px-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}>

        {/* Icon mark with live dot */}
        <div className="relative flex-shrink-0">
          <EtravoMark size={32} />
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 bg-emerald-400"
            style={{ borderColor: "var(--sidebar-bg)", animation: "liveDot 2s ease-in-out infinite" }}/>
        </div>

        {show && (
          <span className="font-display font-black text-white text-[1.1rem] tracking-[-0.02em] whitespace-nowrap">
            ETRAVO
          </span>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
        {show && (
          <p className="text-[9px] font-black uppercase tracking-[0.18em] px-3 py-2"
            style={{ color: "rgba(255,255,255,.22)" }}>Main</p>
        )}
        {NAV_ITEMS.slice(0, 5).filter(item => !item.adminOnly || user.role === "Super Admin").map((item, i) => (
          <NavBtn key={item.id} item={item} active={page === item.id}
            badge={item.id === "boarding" ? pending.length : 0}
            show={show} onClick={() => navTo(item.id)} delay={i * 35} />
        ))}
        {show && (
          <p className="text-[9px] font-black uppercase tracking-[0.18em] px-3 py-2 pt-4"
            style={{ color: "rgba(255,255,255,.22)" }}>Fleet</p>
        )}
        {!show && <div className="my-2 mx-3 h-px" style={{ background: "var(--sidebar-border)" }} />}
        {NAV_ITEMS.slice(5).map((item, i) => (
          <NavBtn key={item.id} item={item} active={page === item.id}
            badge={0} show={show} onClick={() => navTo(item.id)} delay={(5 + i) * 35} />
        ))}
      </nav>

      {/* User footer */}
      <div className="flex-shrink-0 p-2" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        {show ? (
          <div className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all hover:bg-white/5 group"
            onClick={() => navTo("settings")}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#5b5bd6,#7c3aed)" }}>
              {(user.name || "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,.35)" }}>{user.role}</p>
            </div>
            <Ic n="chevR" c="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black cursor-pointer"
              style={{ background: "linear-gradient(135deg,#5b5bd6,#7c3aed)" }}
              onClick={() => navTo("settings")}>
              {(user.name || "?")[0].toUpperCase()}
            </div>
          </div>
        )}
        <button onClick={() => setLogoutC(true)}
          className={`sidebar-btn w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
            transition-all text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 relative mt-0.5`}>
          <Ic n="logout" c="w-4 h-4 flex-shrink-0" />
          {show && <span>Sign out</span>}
          {!show && <span className="sidebar-tooltip">Sign out</span>}
        </button>
      </div>
    </aside>
  );
}

function NavBtn({ item, active, badge, show, onClick, delay }) {
  return (
    <button onClick={onClick}
      className={`sidebar-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold
        transition-all duration-150 relative group
        ${active ? "nav-active" : "text-slate-500 hover:text-white hover:bg-white/6"}`}
      style={{ animationDelay: delay + "ms" }}>
      <Ic n={item.icon} c="w-4 h-4 flex-shrink-0" />
      {show && <span className="truncate">{item.label}</span>}
      {item.id === "tracking" && show && (
        <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full"
          style={{ background: "rgba(14,165,233,.15)", color: "#38bdf8", border: "1px solid rgba(14,165,233,.25)" }}>
          LIVE
        </span>
      )}
      {badge > 0 && show && (
        <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-black px-1"
          style={{ background: "rgba(239,68,68,.2)", color: "#f87171", border: "1px solid rgba(239,68,68,.3)" }}>
          {badge}
        </span>
      )}
      {badge > 0 && !show && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
      )}
      {!show && <span className="sidebar-tooltip">{item.label}</span>}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function DashboardShell({ user }) {
  const { signOut } = useAuth();

  const [page,      setPage]    = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSide, setMobile] = useState(false);

  // Track real viewport width — source of truth for mobile vs desktop
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobile(false); // auto-close mobile drawer when expanding
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  const [dropdown,  setDropdown] = useState(null);
  const [toast,     setToast]   = useState(null);
  const [logoutC,   setLogoutC] = useState(false);
  const [gSearch,   setGSearch] = useState("");

  const [emp,     setEmpState]     = useState([]);
  const [drivers, setDriversState] = useState([]);
  const [cars,    setCarsState]    = useState([]);
  const [routes,  setRoutesState]  = useState([]);
  const [loaded,  setLoaded]       = useState(false);

  const showToast = useCallback((msg, type = "info") => setToast({ msg, type, id: Date.now() }), []);
  const navTo = p => { setPage(p); setMobile(false); setDropdown(null); setGSearch(""); };

  const nEmp  = e => ({ id: e.id, name: e.name, email: e.email, phone: e.phone, coords: e.coords, address: e.address, shift: e.shift, status: e.status, routeId: e.route_id });
  const nDrv  = d => ({ id: d.id, name: d.name, license: d.license, phone: d.phone, carId: d.car_id, status: d.status, routeId: null });
  const nCar  = c => ({ id: c.id, number: c.number, type: c.type, capacity: c.capacity, driverId: c.driver_id, status: c.status });
  const nRt   = r => ({ id: r.id, name: r.name, shift: r.shift, shift_type: r.shift_type, origin: r.origin, destination: r.destination, description: r.description, is_active: r.is_active, employeeIds: r.employeeIds || [] });

  useEffect(() => {
    (async () => {
      try {
        const [e, d, c, r] = await Promise.all([db.employees.list(), db.drivers.list(), db.cars.list(), db.routes.listWithEmployees()]);
        setEmpState(e.map(nEmp)); setDriversState(d.map(nDrv)); setCarsState(c.map(nCar)); setRoutesState(r.map(nRt));
      } catch (err) { showToast("Load error: " + err.message, "error"); }
      finally { setLoaded(true); }
    })();
  }, []);

  const setEmp = useCallback(async upd => {
    const next = typeof upd === "function" ? upd(emp) : upd;
    setEmpState(next);
    for (const u of next) {
      const old = emp.find(e => e.id === u.id);
      if (!old) { try { const c = await db.employees.create({ id: u.id, name: u.name, address: u.address, coords: u.coords, shift: u.shift, status: u.status }); setEmpState(p => p.map(e => e.id === u.id ? nEmp(c) : e)); } catch (err) { showToast(err.message, "error"); } }
      else if (JSON.stringify(old) !== JSON.stringify(u)) { try { await db.employees.update(u.id, { status: u.status, route_id: u.routeId || null }); } catch (err) { showToast(err.message, "error"); } }
    }
    const ids = new Set(next.map(e => e.id));
    for (const o of emp) { if (!ids.has(o.id)) { try { await db.employees.delete(o.id); } catch (err) { showToast(err.message, "error"); } } }
  }, [emp, showToast]);

  const setDrivers = useCallback(async upd => {
    const next = typeof upd === "function" ? upd(drivers) : upd;
    setDriversState(next);
    for (const u of next) {
      const old = drivers.find(d => d.id === u.id);
      if (!old) { try { await db.drivers.create({ id: u.id, name: u.name, license: u.license, phone: u.phone, car_id: u.carId || null, status: u.status }); } catch (err) { showToast(err.message, "error"); } }
      else if (JSON.stringify(old) !== JSON.stringify(u)) { try { await db.drivers.update(u.id, { name: u.name, license: u.license, phone: u.phone, car_id: u.carId || null, status: u.status }); } catch (err) { showToast(err.message, "error"); } }
    }
    const ids = new Set(next.map(d => d.id));
    for (const o of drivers) { if (!ids.has(o.id)) { try { await db.drivers.delete(o.id); } catch (err) { showToast(err.message, "error"); } } }
  }, [drivers, showToast]);

  const setCars = useCallback(async upd => {
    const next = typeof upd === "function" ? upd(cars) : upd;
    setCarsState(next);
    for (const u of next) {
      const old = cars.find(c => c.id === u.id);
      if (!old) { try { await db.cars.create({ id: u.id, number: u.number, type: u.type, capacity: Number(u.capacity), driver_id: u.driverId || null, status: u.status }); } catch (err) { showToast(err.message, "error"); } }
      else if (JSON.stringify(old) !== JSON.stringify(u)) { try { await db.cars.update(u.id, { number: u.number, type: u.type, capacity: Number(u.capacity), driver_id: u.driverId || null, status: u.status }); } catch (err) { showToast(err.message, "error"); } }
    }
    const ids = new Set(next.map(c => c.id));
    for (const o of cars) { if (!ids.has(o.id)) { try { await db.cars.delete(o.id); } catch (err) { showToast(err.message, "error"); } } }
  }, [cars, showToast]);

  const setRoutes = useCallback(async upd => {
    const next = typeof upd === "function" ? upd(routes) : upd;
    setRoutesState(next);
    for (const u of next) {
      const old = routes.find(r => r.id === u.id);
      if (!old) { try { await db.routes.create(u); } catch (err) { showToast(err.message, "error"); } }
      else if (JSON.stringify(old) !== JSON.stringify(u)) {
        try {
          await db.routes.update(u.id, u);
          const added = u.employeeIds.filter(id => !old.employeeIds.includes(id));
          const gone  = old.employeeIds.filter(id => !u.employeeIds.includes(id));
          for (const id of added) await db.routes.addEmployee(u.id, id);
          for (const id of gone)  await db.routes.removeEmployee(u.id, id);
        } catch (err) { showToast(err.message, "error"); }
      }
    }
    const ids = new Set(next.map(r => r.id));
    for (const o of routes) { if (!ids.has(o.id)) { try { await db.routes.delete(o.id); } catch (err) { showToast(err.message, "error"); } } }
  }, [routes, showToast]);

  const pending = emp.filter(e => e.status === "pending");
  const hits    = gSearch.trim().length > 1
    ? emp.filter(e => e.name.toLowerCase().includes(gSearch.toLowerCase()) || e.id.toLowerCase().includes(gSearch.toLowerCase())).slice(0, 5)
    : [];

  if (!loaded) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--sidebar-bg)" }}>
      <div className="flex flex-col items-center gap-5">
        <EtravoMark size={56} />
        <div className="flex gap-2">
          {[0,1,2].map(i => <span key={i} className="w-2 h-2 rounded-full bg-indigo-500/60"
            style={{ animation: `liveDot 1.1s ease-in-out ${i*0.18}s infinite` }} />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* Mobile sidebar — only when truly mobile AND toggled open */}
      {isMobile && mobileSide && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMobile(false)}
            style={{ background: "rgba(13,15,20,.65)" }} />
          <SideBar mob collapsed={false} user={user} page={page} pending={pending} navTo={navTo} setLogoutC={setLogoutC} />
        </>
      )}
      {/* Desktop sidebar — only when NOT mobile */}
      {!isMobile && <SideBar collapsed={collapsed} user={user} page={page} pending={pending} navTo={navTo} setLogoutC={setLogoutC} />}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── TOP BAR ── */}
        <header className="glass flex items-center h-[57px] px-5 gap-3 flex-shrink-0 z-20"
          style={{ borderBottom: "1px solid var(--border)" }}>

          <button onClick={() => isMobile ? setMobile(o => !o) : setCollapsed(o => !o)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex-shrink-0">
            <Ic n="menu" c="w-4 h-4" />
          </button>

          <div className="relative flex-1 max-w-xs">
            <Ic n="search" c="w-3.5 h-3.5 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input value={gSearch} onChange={e => setGSearch(e.target.value)}
              placeholder="Search employees, IDs…"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder-slate-300 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all" />
            {hits.length > 0 && (
              <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-2xl overflow-hidden z-50"
                style={{ boxShadow: "0 20px 60px rgba(0,0,0,.14)", border: "1px solid #f1f5f9" }}>
                {hits.map(e => (
                  <button key={e.id} onClick={() => { navTo("boarding"); setGSearch(""); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors border-b border-slate-50 last:border-0">
                    <Avt name={e.name} sz="w-7 h-7" tx="text-xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">{e.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{e.id}</p>
                    </div>
                    <Badge s={e.status} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1" />

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500"
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              style={{ animation: "liveDot 2s ease-in-out infinite" }} />
            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>

          <div className="relative">
            <button onClick={() => setDropdown(d => d === "notif" ? null : "notif")}
              className="relative w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
              <Ic n="bell" c="w-4 h-4" />
              {pending.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                  {pending.length}
                </span>
              )}
            </button>
            {dropdown === "notif" && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl z-50 fi overflow-hidden"
                style={{ boxShadow: "0 24px 70px rgba(0,0,0,.14)", border: "1px solid #f1f5f9" }}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                  <span className="font-display font-bold text-slate-800">Notifications</span>
                  {pending.length > 0 && (
                    <span className="text-[10px] font-black px-2 py-1 rounded-full bg-rose-50 text-rose-500 border border-rose-100">
                      {pending.length} pending
                    </span>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {pending.length === 0
                    ? <div className="py-10 text-center text-sm text-slate-300 font-semibold">All clear 🎉</div>
                    : pending.map(e => (
                      <button key={e.id} onClick={() => navTo("boarding")}
                        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 text-left transition-colors border-b border-slate-50 last:border-0">
                        <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">New boarding request</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{e.name} · {e.shift}</p>
                        </div>
                      </button>
                    ))
                  }
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button onClick={() => setDropdown(d => d === "profile" ? null : "profile")}
              className="flex items-center gap-2 pl-3 ml-1 transition-opacity hover:opacity-80"
              style={{ borderLeft: "1px solid #e2e8f0" }}>
              <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black"
                style={{ background: "linear-gradient(135deg,#5b5bd6,#7c3aed)" }}>
                {(user.name || "?")[0].toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[12px] font-bold text-slate-800 leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{user.role}</p>
              </div>
              <Ic n="chevD" c="w-3 h-3 text-slate-300 hidden sm:block" />
            </button>
            {dropdown === "profile" && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl z-50 fi overflow-hidden"
                style={{ boxShadow: "0 24px 70px rgba(0,0,0,.14)", border: "1px solid #f1f5f9" }}>
                <div className="px-4 py-4 border-b border-slate-50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black"
                    style={{ background: "linear-gradient(135deg,#5b5bd6,#7c3aed)" }}>
                    {(user.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="p-1.5">
                  {[["settings","Settings","cog"],["reports","Reports","chart"]].map(([pg,lbl,ic]) => (
                    <button key={pg} onClick={() => navTo(pg)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 font-semibold transition-colors">
                      <Ic n={ic} c="w-4 h-4 text-slate-400"/>{lbl}
                    </button>
                  ))}
                  <div className="my-1 border-t border-slate-100" />
                  <button onClick={() => { setDropdown(null); setLogoutC(true); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-rose-500 hover:bg-rose-50 font-semibold transition-colors">
                    <Ic n="logout" c="w-4 h-4"/>Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ── CONTENT ── */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-7"
          onClick={() => { if (dropdown) setDropdown(null); if (gSearch) setGSearch(""); }}>
          {page === "dashboard" && <PageDashboard emp={emp} routes={routes} drivers={drivers} cars={cars} onNav={navTo}/>}
          {page === "boarding"  && <PageBoarding  toast={showToast}/>}
          {page === "employees" && <PageEmployees emp={emp} routes={routes}/>}
          {page === "routes"    && <PageRoutes    toast={showToast}/>}
          {page === "trips"     && <PageTrips     routes={routes} drivers={drivers} cars={cars} employees={emp} toast={showToast}/>}
          {page === "tracking"  && <PageTracking  routes={routes} drivers={drivers} cars={cars} emp={emp} user={user}/>}
          {page === "drivers"   && <PageDrivers   drivers={drivers} setDrivers={setDrivers} cars={cars} routes={routes} toast={showToast}/>}
          {page === "cars"      && <PageCars      toast={showToast} onRefreshDrivers={() => db.drivers.list().then(d => setDriversState(d.map(nDrv)))}/>}
          {/* {page === "schedule"  && <PageSchedule  drivers={drivers} routes={routes} cars={cars} emp={emp}/>} */}
          {page === "reports"   && <PageReports   emp={emp} routes={routes} cars={cars} drivers={drivers}/>}
          {page === "settings"  && <PageSettings  toast={showToast} user={user}/>}
        </main>
      </div>

      {toast && <Toast key={toast.id} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <Confirm open={logoutC} msg={`Sign out of ETRAVO, ${user.name}?`} onYes={signOut} onNo={() => setLogoutC(false)} />
    </div>
  );
}