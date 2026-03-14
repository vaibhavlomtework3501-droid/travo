import { useState } from "react";
import { Ic, Avt, Badge, CapBar, Inp, Lbl, Btn } from "../components/UI";

// ── SCHEDULE ──
export function PageSchedule({ drivers, routes, cars, emp }) {
  const scheduled   = drivers.filter(d => d.routeId);
  const unscheduled = drivers.filter(d => !d.routeId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Driver Schedule</h1>
        <p className="text-sm text-slate-400 mt-0.5">Assigned routes and pickup details</p>
      </div>

      {scheduled.length === 0 && (
        <div className="bg-white rounded-2xl p-14 text-center text-slate-300 border border-slate-100">
          <Ic n="calendar" c="w-10 h-10 mx-auto mb-2"/><p>No drivers scheduled yet.</p>
        </div>
      )}

      <div className="grid gap-4">
        {scheduled.map(driver => {
          const route   = routes.find(r => r.id === driver.routeId);
          const car     = cars.find(c => c.id === driver.carId);
          const pickups = route ? emp.filter(e => route.employeeIds.includes(e.id)) : [];
          return (
            <div key={driver.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all overflow-hidden">
              <div className="flex items-center gap-4 p-5 border-b border-slate-50">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-lg">{driver.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-800">{driver.name}</h3>
                  <p className="text-xs text-slate-400">License: {driver.license} · {driver.phone}</p>
                </div>
                <Badge s={driver.status}/>
              </div>
              <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[["Route",route?.name||"—","text-indigo-600"],["Car Type",car?.type||"—","text-slate-700"],["Car No.",car?.number||"—","text-slate-700 font-mono"],["Shift",route?.shift||"—","text-teal-600"]].map(([lbl,val,tc])=>(
                  <div key={lbl} className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 mb-0.5 font-bold uppercase">{lbl}</p>
                    <p className={`text-xs font-bold leading-snug ${tc}`}>{val}</p>
                  </div>
                ))}
              </div>
              {pickups.length > 0 && (
                <div className="px-5 pb-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Pickup Employees ({pickups.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {pickups.map(e=>(
                      <div key={e.id} className="flex items-center gap-1.5 bg-indigo-50 rounded-lg px-2.5 py-1.5">
                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">{e.name[0]}</div>
                        <span className="text-xs font-semibold text-indigo-700">{e.name}</span>
                        <span className="text-[10px] text-indigo-400">{e.shift}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {unscheduled.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-bold text-slate-600 text-sm mb-3">Unscheduled Drivers ({unscheduled.length})</h2>
          <div className="flex flex-wrap gap-3">
            {unscheduled.map(d => (
              <div key={d.id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                <Avt name={d.name} sz="w-7 h-7" tx="text-xs"/>
                <span className="text-xs font-semibold text-slate-600">{d.name}</span>
                <Badge s={d.status}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── REPORTS ──
export function PageReports({ emp, routes, cars, drivers }) {
  const approved  = emp.filter(e => e.status === "approved").length;
  const pending   = emp.filter(e => e.status === "pending").length;
  const totalCap  = routes.reduce((s,r) => s + ((cars.find(c=>c.id===r.carId)||{}).capacity||0), 0);
  const totalUsed = routes.reduce((s,r) => s + r.employeeIds.length, 0);
  const utilPct   = totalCap ? Math.round((totalUsed/totalCap)*100) : 0;
  const bars      = [72,85,68,91,78,94,88];

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-black text-slate-800">Reports</h1><p className="text-sm text-slate-400 mt-0.5">Analytics and operational insights</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l:"Fleet Utilization",  v:`${utilPct}%`,  d:`${totalUsed}/${totalCap} seats`, g:"from-indigo-500 to-blue-600" },
          { l:"Approval Rate",      v:`${emp.length?Math.round((approved/emp.length)*100):0}%`, d:`${approved}/${emp.length} approved`, g:"from-emerald-500 to-teal-600" },
          { l:"Active Drivers",     v:drivers.filter(d=>d.status==="active").length, d:`of ${drivers.length} total`, g:"from-violet-500 to-purple-600" },
          { l:"Pending Requests",   v:pending, d:"Awaiting review", g:"from-amber-500 to-orange-600" },
        ].map(card => (
          <div key={card.l} className={`bg-gradient-to-br ${card.g} rounded-2xl p-5 text-white shadow-xl hover:scale-[1.02] transition-all`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-2">{card.l}</p>
            <p className="text-4xl font-black">{card.v}</p>
            <p className="text-[11px] text-white/60 mt-1.5">{card.d}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-bold text-slate-800 text-sm mb-4">Weekly Trip Volume</h2>
          <div className="flex items-end gap-2 h-36">
            {bars.map((h,i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-semibold">{h}</span>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 hover:from-indigo-700 hover:to-indigo-500 transition-colors cursor-default" style={{height:`${h}%`}}/>
                <span className="text-[10px] text-slate-400">{["M","T","W","T","F","S","S"][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-bold text-slate-800 text-sm mb-4">Route Capacity</h2>
          <div className="space-y-3">
            {routes.length === 0
              ? <p className="text-slate-300 text-xs text-center py-4">No routes</p>
              : routes.map(r => {
                const cap = (cars.find(c=>c.id===r.carId)||{}).capacity||0;
                return (
                  <div key={r.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-600 truncate">{r.name}</span>
                      <span className="text-slate-400 ml-2 flex-shrink-0">{r.employeeIds.length}/{cap}</span>
                    </div>
                    <CapBar used={r.employeeIds.length} total={cap}/>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SETTINGS ──
export function PageSettings({ toast, user }) {
  const [tog, setTog] = useState({ boarding:true, routes:true, driver:false, email:true, sms:false });
  const [profile, setProfile] = useState({ name:user.name, email:user.email, phone:"+91 99999 00000" });

  const Toggle = ({ k, label }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <button onClick={()=>setTog(p=>({...p,[k]:!p[k]}))} className={`w-11 h-6 rounded-full relative transition-colors ${tog[k]?"bg-indigo-500":"bg-slate-200"}`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${tog[k]?"right-0.5":"left-0.5"}`}/>
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-black text-slate-800">Settings</h1><p className="text-sm text-slate-400 mt-0.5">Configure your ETRAVO preferences</p></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h2 className="font-black text-slate-800">Admin Profile</h2>
          <div><Lbl>Name</Lbl><Inp value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))}/></div>
          <div><Lbl>Email</Lbl><Inp value={profile.email} onChange={e=>setProfile(p=>({...p,email:e.target.value}))}/></div>
          <div><Lbl>Phone</Lbl><Inp value={profile.phone} onChange={e=>setProfile(p=>({...p,phone:e.target.value}))}/></div>
          <Btn className="w-full justify-center" onClick={()=>toast("Profile saved ✓","success")}>Save Changes</Btn>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h2 className="font-black text-slate-800 mb-3">Notifications</h2>
            <Toggle k="boarding" label="New boarding requests"/>
            <Toggle k="routes"   label="Route changes"/>
            <Toggle k="driver"   label="Driver alerts"/>
            <Toggle k="email"    label="Email notifications"/>
            <Toggle k="sms"      label="SMS notifications"/>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h2 className="font-black text-slate-800 mb-3">System Info</h2>
            {[["Time Zone","Asia/Kolkata (IST)"],["Language","English"],["Date Format","DD/MM/YYYY"],["Version","ETRAVO v2.5"]].map(([k,v]) => (
              <div key={k} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-500">{k}</span>
                <span className="text-sm font-semibold text-slate-700">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
