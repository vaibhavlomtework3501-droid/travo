// ═══════════════════════════════════════════════════════════════
//  src/pages/PageTrips.jsx
//  Admin: Create & manage trips
//  - Select route → only that route's employees are shown
//  - Select driver → car auto-populates from driver's assigned car
//  - Trip type: Pickup | Drop
//  - Employees already in an active trip of the same type are excluded
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Ic, Avt, Btn, Modal, PageHeader, Empty, Card, Lbl, Sel, Inp } from "../components/UI";

const uid = () => Math.random().toString(36).slice(2, 7).toUpperCase();

function statusColor(s) {
  if (s === "in_progress") return { bg: "rgba(16,185,129,.1)",  color: "#059669", border: "rgba(16,185,129,.3)", dot: "#10b981",  label: "In Progress" };
  if (s === "completed")   return { bg: "rgba(99,102,241,.08)", color: "#4f46e5", border: "rgba(99,102,241,.2)", dot: "#6366f1",  label: "Completed" };
  if (s === "cancelled")   return { bg: "rgba(239,68,68,.08)",  color: "#dc2626", border: "rgba(239,68,68,.2)",  dot: "#ef4444",  label: "Cancelled" };
  return                          { bg: "rgba(245,158,11,.08)", color: "#d97706", border: "rgba(245,158,11,.2)", dot: "#f59e0b",  label: "Scheduled" };
}

function CreateTripModal({ routes, drivers, cars, onSave, onClose }) {
  const [form, setForm] = useState({
    routeId: "", driverId: "", carId: "",
    scheduledAt: "", shiftLabel: "", tripType: "pickup",
  });
  const [routeEmps, setRouteEmps] = useState([]);
  const [selected,  setSelected]  = useState([]);
  const [busyEmps,  setBusyEmps]  = useState(new Set());
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  // When route changes → load its employees
  useEffect(() => {
    setSelected([]);
    if (!form.routeId) { setRouteEmps([]); return; }
    const loadRouteEmps = async () => {
      const { data } = await supabase
        .from("route_employees")
        .select("employee_id, employees(id, name, address, shift, status, lat, lng)")
        .eq("route_id", form.routeId);
      setRouteEmps((data || []).map(d => d.employees).filter(Boolean));
    };
    loadRouteEmps();
  }, [form.routeId]);

  // When driver changes → auto-populate car
  useEffect(() => {
    if (!form.driverId) { setForm(p => ({ ...p, carId: "" })); return; }
    const drv = drivers.find(d => d.id === form.driverId);
    // Use carId (normalized by DashboardShell nDrv) — fall back to raw car_id just in case
    const carId = drv?.carId || drv?.car_id || drv?.cars?.id || "";
    setForm(p => ({ ...p, carId }));
  }, [form.driverId]);

  // Load employees busy in active trip of same type
  useEffect(() => {
    const loadBusy = async () => {
      const { data: activeTrips } = await supabase
        .from("trips").select("id")
        .in("status", ["scheduled", "in_progress"])
        .eq("trip_type", form.tripType);
      if (!activeTrips?.length) { setBusyEmps(new Set()); return; }
      const { data } = await supabase
        .from("trip_employees").select("employee_id")
        .in("trip_id", activeTrips.map(t => t.id));
      setBusyEmps(new Set((data || []).map(d => d.employee_id)));
    };
    loadBusy();
  }, [form.tripType]);

  const selectedCar = cars.find(c => c.id === form.carId);
  const capacity    = selectedCar?.capacity || 99;

  const toggleEmp = id => {
    if (busyEmps.has(id)) return;
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : p.length < capacity ? [...p, id] : p);
  };

  const handleSave = async () => {
    if (!form.routeId || !form.driverId) { setError("Route and driver are required."); return; }
    setSaving(true); setError("");
    try {
      const tripId = "T" + uid();
      const { error: tErr } = await supabase.from("trips").insert({
        id: tripId, route_id: form.routeId, driver_id: form.driverId,
        car_id: form.carId || null, status: "scheduled",
        scheduled_at: form.scheduledAt || null, shift_label: form.shiftLabel || null,
        trip_type: form.tripType,
      });
      if (tErr) throw tErr;

      if (selected.length > 0) {
        const rows = selected.map(emp_id => ({ trip_id: tripId, employee_id: emp_id, pickup_status: "pending" }));
        const { error: eErr } = await supabase.from("trip_employees").insert(rows);
        if (eErr) throw eErr;
      }
      onSave();
    } catch (err) { setError(err.message); setSaving(false); }
  };

  const typeConfig = {
    pickup: { icon: "🚐", label: "Pickup", sub: "Pick employees from their locations", color: "#5b5bd6" },
    drop:   { icon: "🏠", label: "Drop",   sub: "Drop employees at home locations",    color: "#10b981" },
  };

  return (
    <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
      {error && <div className="rounded-xl p-3 text-xs font-semibold" style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239" }}>{error}</div>}

      {/* Trip Type */}
      <div>
        <Lbl>Trip Type *</Lbl>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(typeConfig).map(([type, cfg]) => (
            <button key={type} type="button" onClick={() => setForm(p => ({ ...p, tripType: type }))}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center"
              style={{ background: form.tripType === type ? cfg.color + "10" : "#f8fafc", borderColor: form.tripType === type ? cfg.color : "#e2e8f0" }}>
              <span className="text-xl">{cfg.icon}</span>
              <span className="text-xs font-black" style={{ color: form.tripType === type ? cfg.color : "#64748b" }}>{cfg.label}</span>
              <span className="text-[10px] text-slate-400 font-medium leading-tight">{cfg.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Route */}
      <div>
        <Lbl>Route * (employees auto-load when selected)</Lbl>
        <Sel value={form.routeId} onChange={set("routeId")}>
          <option value="">— Select route to see its employees —</option>
          {routes.map(r => <option key={r.id} value={r.id}>{r.name} · {r.shift}</option>)}
        </Sel>
      </div>

      {/* Driver + Car */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Lbl>Driver *</Lbl>
          <Sel value={form.driverId} onChange={set("driverId")}>
            <option value="">— Select driver —</option>
            {drivers.filter(d => d.status !== "on-leave").map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.status})</option>
            ))}
          </Sel>
        </div>
        <div>
          <Lbl>Vehicle (auto-filled from driver)</Lbl>
          {form.carId ? (
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold text-slate-700"
              style={{ background: "rgba(16,185,129,.06)", border: "1.5px solid rgba(16,185,129,.25)" }}>
              <Ic n="truck" c="w-4 h-4 text-emerald-500" />
              {cars.find(c => c.id === form.carId)?.number || form.carId}
              <span className="text-xs text-slate-400 font-normal ml-auto">{selectedCar?.type} · {selectedCar?.capacity} seats</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm text-slate-400"
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}>
              <Ic n="truck" c="w-4 h-4 text-slate-300" />
              {form.driverId ? "Driver has no car assigned" : "Select a driver first"}
            </div>
          )}
        </div>
      </div>

      {/* Shift + Schedule */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Lbl>Shift Label</Lbl>
          <Sel value={form.shiftLabel} onChange={set("shiftLabel")}>
            <option value="">— Shift —</option>
            <option>08:30 AM</option><option>09:00 AM</option>
            <option>10:00 AM</option><option>02:00 PM</option><option>06:00 PM</option>
          </Sel>
        </div>
        <div>
          <Lbl>Schedule Date/Time</Lbl>
          <Inp type="datetime-local" value={form.scheduledAt} onChange={set("scheduledAt")} />
        </div>
      </div>

      {/* Employee picker */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Lbl>{form.routeId ? "Employees on this route" : "Select a route to see employees"}</Lbl>
          <span className="text-xs font-bold text-slate-500">{selected.length}{selectedCar ? `/${capacity}` : ""} selected</span>
        </div>

        {!form.routeId ? (
          <div className="rounded-xl p-4 text-center text-slate-400 text-sm" style={{ background: "#f8fafc", border: "1.5px dashed #e2e8f0" }}>
            ← Select a route above to see its employees
          </div>
        ) : routeEmps.length === 0 ? (
          <div className="rounded-xl p-4 text-center text-slate-400 text-sm" style={{ background: "#f8fafc" }}>
            No employees assigned to this route. Assign them in Routes Management first.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {routeEmps.map(emp => {
              const isBusy     = busyEmps.has(emp.id);
              const isSelected = selected.includes(emp.id);
              const isFull     = selected.length >= capacity && !isSelected;
              return (
                <div key={emp.id} onClick={() => !isBusy && !isFull && toggleEmp(emp.id)}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{
                    background: isSelected ? "rgba(91,91,214,.06)" : "#f8fafc",
                    border: `1.5px solid ${isSelected ? "rgba(91,91,214,.3)" : "#e2e8f0"}`,
                    opacity: isBusy || isFull ? 0.5 : 1,
                    cursor: isBusy || isFull ? "not-allowed" : "pointer",
                  }}>
                  <div className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center"
                    style={{ background: isSelected ? "#5b5bd6" : "white", border: `2px solid ${isSelected ? "#5b5bd6" : "#d1d5db"}` }}>
                    {isSelected && <svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <Avt name={emp.name} sz="w-8 h-8" tx="text-xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{emp.name}</p>
                    <p className="text-xs text-slate-400 truncate">{emp.address || emp.shift}</p>
                  </div>
                  {isBusy && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#fee2e2", color: "#dc2626" }}>IN TRIP</span>}
                  {isFull && !isSelected && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#f1f5f9", color: "#94a3b8" }}>FULL</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
        <Btn v="secondary" className="flex-1" onClick={onClose}>Cancel</Btn>
        <Btn className="flex-1" onClick={handleSave} disabled={saving}>
          {saving ? "Creating…" : <><Ic n="plus" c="w-4 h-4" />Create Trip</>}
        </Btn>
      </div>
    </div>
  );
}

function TripCard({ trip, drivers, cars, routes, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const sc      = statusColor(trip.status);
  const drv     = trip.drivers || drivers.find(d => d.id === trip.driver_id);
  const car     = trip.cars    || cars.find(c => c.id === trip.car_id);
  const rte     = trip.routes  || routes.find(r => r.id === trip.route_id);
  const isPickup = trip.trip_type === "pickup";

  const cancelTrip = async () => {
    await supabase.from("trips").update({ status: "cancelled" }).eq("id", trip.id);
    onRefresh();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg,${sc.dot},${sc.dot}66)` }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
              <span className="text-lg">{isPickup ? "🚐" : "🏠"}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-800">{rte?.name || trip.route_id}</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: isPickup ? "rgba(91,91,214,.08)" : "rgba(16,185,129,.08)", color: isPickup ? "#5b5bd6" : "#059669", border: `1px solid ${isPickup ? "rgba(91,91,214,.2)" : "rgba(16,185,129,.2)"}` }}>
                  {isPickup ? "PICKUP" : "DROP"}
                </span>
                <span className="font-mono text-[10px] text-slate-400">{trip.id}</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-flex items-center gap-1"
                style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />{sc.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setExpanded(p => !p)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50">
              <Ic n={expanded ? "chevD" : "chevR"} c="w-4 h-4" />
            </button>
            {trip.status === "scheduled" && (
              <button onClick={cancelTrip} className="w-8 h-8 flex items-center justify-center rounded-xl" style={{ background: "#fee2e2", color: "#dc2626" }}>
                <Ic n="x" c="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "Driver",     val: drv?.name || "—" },
            { label: "Vehicle",    val: car?.number || "—" },
            { label: "Passengers", val: trip.trip_employees?.length || 0 },
          ].map(({ label, val }) => (
            <div key={label} className="rounded-xl p-2.5" style={{ background: "#f8fafc" }}>
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">{label}</p>
              <p className="text-xs font-bold text-slate-700 truncate">{val}</p>
            </div>
          ))}
        </div>

        {expanded && (trip.trip_employees?.length || 0) > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Passenger List</p>
            <div className="space-y-1.5">
              {trip.trip_employees.map(te => (
                <div key={te.employee_id} className="flex items-center gap-2.5 p-2 rounded-xl"
                  style={{ background: te.pickup_status !== "pending" ? "rgba(16,185,129,.06)" : "#f8fafc", border: `1px solid ${te.pickup_status !== "pending" ? "rgba(16,185,129,.2)" : "#e2e8f0"}` }}>
                  <Avt name={te.employees?.name || "?"} sz="w-7 h-7" tx="text-[10px]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">{te.employees?.name || te.employee_id}</p>
                    <p className="text-[10px] text-slate-400 truncate">{te.employees?.address || "—"}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: te.pickup_status !== "pending" ? "rgba(16,185,129,.12)" : "#f1f5f9", color: te.pickup_status !== "pending" ? "#059669" : "#94a3b8" }}>
                    {te.pickup_status === "picked" ? "✓ Picked" : te.pickup_status === "dropped" ? "✓ Dropped" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(trip.scheduled_at || trip.started_at) && (
          <div className="mt-3 flex gap-4 text-[11px] text-slate-400 font-medium flex-wrap">
            {trip.scheduled_at && <span>📅 {new Date(trip.scheduled_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>}
            {trip.started_at   && <span>🟢 Started {new Date(trip.started_at).toLocaleTimeString("en-IN", { timeStyle: "short" })}</span>}
            {trip.ended_at     && <span>🏁 Ended {new Date(trip.ended_at).toLocaleTimeString("en-IN", { timeStyle: "short" })}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PageTrips({ routes, drivers, cars, employees, toast }) {
  const [trips,      setTrips]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [filter,     setFilter]     = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const loadTrips = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("trips")
      .select("*, routes(id, name, shift), drivers(id, name, phone), cars(id, number, type, capacity), trip_employees(employee_id, pickup_status, employees(id, name, address, phone))")
      .order("created_at", { ascending: false });
    if (error) console.error(error.message);
    setTrips(data || []);
    setLoading(false);
  };

  useEffect(() => { loadTrips(); }, []);

  let filtered = filter === "all" ? trips : trips.filter(t => t.status === filter);
  if (typeFilter !== "all") filtered = filtered.filter(t => t.trip_type === typeFilter);

  const counts = {
    all:         trips.length,
    scheduled:   trips.filter(t => t.status === "scheduled").length,
    in_progress: trips.filter(t => t.status === "in_progress").length,
    completed:   trips.filter(t => t.status === "completed").length,
  };

  const FILTERS = [
    { key: "all",         label: "All",         color: "#5b5bd6" },
    { key: "scheduled",   label: "Scheduled",   color: "#f59e0b" },
    { key: "in_progress", label: "In Progress", color: "#10b981" },
    { key: "completed",   label: "Completed",   color: "#6366f1" },
  ];

  // Prepare route data with employee counts for the modal
  const routesWithCounts = routes.map(r => ({
    ...r,
    employeeIds: r.employeeIds || [],
  }));

  return (
    <div className="space-y-5 max-w-[1400px]">
      <PageHeader title="Trips" sub="Create pickup & drop trips — select a route to see its employees, driver auto-populates the vehicle">
        <Btn onClick={() => setCreateOpen(true)}><Ic n="plus" c="w-4 h-4" />Create Trip</Btn>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="rounded-2xl p-4 text-left transition-all hover:brightness-95"
            style={{ background: filter === f.key ? f.color + "18" : "#f8fafc", border: `1.5px solid ${filter === f.key ? f.color + "44" : "#e2e8f0"}` }}>
            <p className="text-2xl font-black" style={{ color: filter === f.key ? f.color : "#0f172a" }}>{counts[f.key]}</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">{f.label}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {[["all", "All Types"], ["pickup", "🚐 Pickup"], ["drop", "🏠 Drop"]].map(([t, l]) => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: typeFilter === t ? "#5b5bd6" : "#f1f5f9", color: typeFilter === t ? "white" : "#64748b" }}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <Card><div className="py-10 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div></Card>
      ) : filtered.length === 0 ? (
        <Card><Empty icon="truck" text="No trips found" sub={filter === "all" ? "Create your first trip above" : `No ${filter.replace("_", " ")} trips`} /></Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map(trip => (
            <TripCard key={trip.id} trip={trip} drivers={drivers} cars={cars} routes={routes} onRefresh={loadTrips} />
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Trip">
        <CreateTripModal
          routes={routesWithCounts} drivers={drivers} cars={cars} employees={employees}
          onSave={() => { setCreateOpen(false); loadTrips(); toast("Trip created ✓", "success"); }}
          onClose={() => setCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}
