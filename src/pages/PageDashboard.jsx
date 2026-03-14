import { Ic, Avt, Badge, CapBar, Card, SectionHead } from "../components/UI";

function StatCard({ title, value, sub, icon, color, delay }) {
  return (
    <div className={`stat-card relative overflow-hidden rounded-2xl p-5 text-white cursor-default fu ${delay}`}
      style={{ background: `linear-gradient(135deg, ${color[0]}, ${color[1]})`,
        boxShadow: `0 8px 32px ${color[0]}40` }}>
      {/* decorative circles */}
      <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full"
        style={{ background: "rgba(255,255,255,.08)" }} />
      <div className="absolute -right-2 bottom-[-28px] w-16 h-16 rounded-full"
        style={{ background: "rgba(255,255,255,.05)" }} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Ic n={icon} c="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 mt-1">{title}</span>
        </div>
        <p className="text-4xl font-display font-black">{value}</p>
        <p className="text-[11px] text-white/60 mt-1.5">{sub}</p>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:scale-105 active:scale-95 group"
      style={{ background: color + "10", border: `1px solid ${color}20` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:shadow-lg"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 14px ${color}44` }}>
        <Ic n={icon} c="w-5 h-5 text-white" />
      </div>
      <span className="text-xs font-bold text-slate-600">{label}</span>
    </button>
  );
}

export default function PageDashboard({ emp, routes, drivers, cars, onNav }) {
  const pending = emp.filter(e => e.status === "pending");
  const fourS   = cars.filter(c => c.type === "4 Seater").length;
  const sixS    = cars.filter(c => c.type === "6 Seater").length;
  const active  = drivers.filter(d => d.status === "active").length;
  const hour    = new Date().getHours();
  const greet   = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl p-7 fu"
        style={{ background: "linear-gradient(135deg, #0d0f14 0%, #1e1b4b 60%, #0c4a6e 100%)" }}>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(91,91,214,.25) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(14,165,233,.2) 0%, transparent 40%)`
        }}/>
        {/* grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0L0 0 0 40" fill="none" stroke="white" strokeWidth="0.8"/>
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
        </svg>
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-indigo-300/80 text-sm font-semibold mb-1">{greet} 👋</p>
            <h1 className="font-display font-black text-white text-3xl tracking-tight">ETRAVO Dashboard</h1>
            <p className="text-white/40 text-sm mt-1.5">
              {new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Fleet status</p>
              <p className="text-white font-display font-black text-2xl">{active}/{drivers.length} <span className="text-white/50 text-base font-medium">active</span></p>
            </div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(14,165,233,.2)", border: "1px solid rgba(14,165,233,.3)" }}>
              <Ic n="truck" c="w-8 h-8 text-sky-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard title="Employees"  value={emp.length}     sub="Total registered" icon="users"     color={["#5b5bd6","#7c3aed"]} delay="d1"/>
        <StatCard title="Pending"    value={pending.length} sub="Awaiting review"  icon="clipboard" color={["#f59e0b","#f97316"]} delay="d2"/>
        <StatCard title="Routes"     value={routes.length}  sub="Currently active" icon="map"       color={["#0ea5e9","#06b6d4"]} delay="d3"/>
        <StatCard title="Drivers"    value={drivers.length} sub={`${active} on duty`} icon="user"   color={["#8b5cf6","#ec4899"]} delay="d4"/>
        <StatCard title="Fleet"      value={cars.length}    sub={`${fourS}×4 · ${sixS}×6 seat`} icon="truck" color={["#10b981","#0ea5e9"]} delay="d5"/>
      </div>

      {/* Quick actions */}
      <Card className="p-5 fu d3">
        <p className="font-display font-bold text-slate-800 text-sm mb-4">Quick Actions</p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          <QuickAction icon="plus"      label="Add Employee" color="#5b5bd6" onClick={() => onNav("boarding")} />
          <QuickAction icon="map"       label="New Route"    color="#0ea5e9" onClick={() => onNav("routes")} />
          <QuickAction icon="user"      label="Add Driver"   color="#8b5cf6" onClick={() => onNav("drivers")} />
          <QuickAction icon="truck"     label="Add Car"      color="#10b981" onClick={() => onNav("cars")} />
          <QuickAction icon="locate"    label="Track Live"   color="#f59e0b" onClick={() => onNav("tracking")} />
          <QuickAction icon="calendar"  label="Schedule"     color="#ec4899" onClick={() => onNav("schedule")} />
          <QuickAction icon="chart"     label="Reports"      color="#f97316" onClick={() => onNav("reports")} />
          <QuickAction icon="cog"       label="Settings"     color="#64748b" onClick={() => onNav("settings")} />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending requests */}
        <Card className="overflow-hidden fu d4">
          <SectionHead title="Boarding Requests"
            action={<button onClick={() => onNav("boarding")} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors flex items-center gap-1">View all <Ic n="arrow" c="w-3 h-3"/></button>} />
          {pending.length === 0
            ? <div className="py-12 text-center"><p className="text-3xl mb-2">🎉</p><p className="text-sm text-slate-300 font-semibold">No pending requests</p></div>
            : pending.slice(0, 4).map(e => (
              <div key={e.id} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors group">
                <Avt name={e.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{e.name}</p>
                  <p className="text-xs text-slate-400 truncate">{e.address} · {e.shift}</p>
                </div>
                <Badge s={e.status} />
              </div>
            ))
          }
        </Card>

        {/* Route capacity */}
        <Card className="overflow-hidden fu d5">
          <SectionHead title="Route Capacity"
            action={<button onClick={() => onNav("routes")} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors flex items-center gap-1">View all <Ic n="arrow" c="w-3 h-3"/></button>} />
          {routes.length === 0
            ? <div className="py-12 text-center"><p className="text-sm text-slate-300 font-semibold">No routes yet</p></div>
            : routes.map(r => {
              const cap = (cars.find(c => c.id === r.carId) || {}).capacity || 0;
              const pct = cap ? Math.round((r.employeeIds.length / cap) * 100) : 0;
              return (
                <div key={r.id} className="px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-slate-800">{r.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "#f1f5f9", color: "#64748b" }}>{r.shift}</span>
                      <span className={`text-[10px] font-black ${pct >= 90 ? "text-rose-500" : pct >= 60 ? "text-amber-500" : "text-emerald-500"}`}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <CapBar used={r.employeeIds.length} total={cap} />
                </div>
              );
            })
          }
        </Card>
      </div>

      {/* Map section */}
      <Card className="overflow-hidden fu d6">
        <SectionHead title="Live Route Map"
          action={
            <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(14,165,233,.1)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,.2)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" style={{ animation: "liveDot 1.5s ease-in-out infinite" }}/>
              Live Tracking
            </span>
          }/>
        <div className="relative h-56 flex items-center justify-center overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0c2340 100%)" }}>
          {/* Animated grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]">
            <defs><pattern id="mapgrid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M36 0L0 0 0 36" fill="none" stroke="#60a5fa" strokeWidth="0.6"/>
            </pattern></defs>
            <rect width="100%" height="100%" fill="url(#mapgrid)"/>
          </svg>
          {/* Route lines */}
          <svg className="absolute inset-0 w-full h-full">
            <polyline points="60,155 190,85 360,115 520,55 670,100" stroke="#5b5bd6" strokeWidth="2" fill="none" strokeDasharray="8 5" opacity="0.6"/>
            <polyline points="110,35 270,128 430,72 600,148" stroke="#0ea5e9" strokeWidth="2" fill="none" strokeDasharray="8 5" opacity="0.6"/>
            {[[190,85],[360,115],[520,55],[670,100],[110,35],[270,128],[430,72],[600,148]].map(([x,y],i) => (
              <g key={i}>
                <circle cx={x} cy={y} r="7" fill={i%2===0?"#5b5bd6":"#0ea5e9"} opacity="0.15"/>
                <circle cx={x} cy={y} r="4" fill={i%2===0?"#5b5bd6":"#0ea5e9"} opacity="0.7"/>
                <circle cx={x} cy={y} r="2.5" fill="white" opacity="0.9"/>
              </g>
            ))}
          </svg>
          <div className="relative z-10 text-center">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center flt"
              style={{ background: "rgba(91,91,214,.25)", border: "1px solid rgba(91,91,214,.35)" }}>
              <Ic n="map" c="w-6 h-6 text-indigo-300" />
            </div>
            <p className="text-sm font-bold text-slate-300">Map integration ready</p>
            <p className="text-xs text-slate-500 mt-1">Connect Google Maps / Mapbox</p>
            <button onClick={() => onNav("tracking")}
              className="mt-3 text-xs font-bold px-4 py-1.5 rounded-xl transition-all hover:brightness-110"
              style={{ background: "rgba(91,91,214,.25)", color: "#a5b4fc", border: "1px solid rgba(91,91,214,.3)" }}>
              Open Live Tracker →
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
