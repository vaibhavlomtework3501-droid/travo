// ═══════════════════════════════════════════════════════════════
//  src/pages/PageRoutes.jsx
//  Routes are standalone — NOT linked to any car or driver.
//  Routes are associated with employees (via route_employees).
//  Admin can create routes and assign/remove employees.
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Ic, Avt, Btn, Modal, Lbl, Inp, Sel, PageHeader, Empty } from "../components/UI";

const uid = () => Math.random().toString(36).slice(2, 7).toUpperCase();

function RouteForm({ form, setForm, onSave, onClose, saving, error }) {
  return (
    <div className="space-y-4">
      {error && <div className="rounded-xl p-3 text-xs font-semibold" style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239" }}>{error}</div>}
      <div><Lbl>Route Name *</Lbl><Inp value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Sector 62 – Main Office" /></div>
      <div><Lbl>Description</Lbl><Inp value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Lbl>Shift Time</Lbl>
          <Sel value={form.shift} onChange={e => setForm(p => ({ ...p, shift: e.target.value }))}>
            <option>08:30 AM</option><option>09:00 AM</option><option>10:00 AM</option>
            <option>02:00 PM</option><option>06:00 PM</option><option>09:00 PM</option>
          </Sel>
        </div>
        <div>
          <Lbl>Shift Type</Lbl>
          <Sel value={form.shift_type} onChange={e => setForm(p => ({ ...p, shift_type: e.target.value }))}>
            <option value="morning">Morning</option><option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option><option value="night">Night</option>
          </Sel>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Lbl>Origin</Lbl><Inp value={form.origin} onChange={e => setForm(p => ({ ...p, origin: e.target.value }))} placeholder="Starting point" /></div>
        <div><Lbl>Destination</Lbl><Inp value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value }))} placeholder="End point" /></div>
      </div>
      <div className="flex gap-3 pt-2">
        <Btn v="secondary" className="flex-1" onClick={onClose}>Cancel</Btn>
        <Btn className="flex-1" onClick={onSave} disabled={saving || !form.name.trim()}>
          {saving ? "Saving…" : <><Ic n="check" c="w-4 h-4" />Save Route</>}
        </Btn>
      </div>
    </div>
  );
}

function AssignEmployeeModal({ route, allEmployees, assignedIds, onAssign, onRemove, onClose }) {
  const [search, setSearch] = useState("");
  const available = allEmployees.filter(e =>
    e.status === "approved" && !assignedIds.includes(e.id) &&
    (e.name.toLowerCase().includes(search.toLowerCase()) || (e.address || "").toLowerCase().includes(search.toLowerCase()))
  );
  const assigned = allEmployees.filter(e => assignedIds.includes(e.id));

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
      <p className="text-xs text-slate-400">Route: <span className="font-bold text-slate-700">{route.name}</span></p>

      {/* Assigned employees */}
      {assigned.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Currently assigned ({assigned.length})</p>
          <div className="space-y-1.5">
            {assigned.map(emp => (
              <div key={emp.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(16,185,129,.05)", border: "1.5px solid rgba(16,185,129,.15)" }}>
                <Avt name={emp.name} sz="w-8 h-8" tx="text-xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{emp.name}</p>
                  <p className="text-xs text-slate-400 truncate">{emp.address || emp.shift}</p>
                </div>
                <button onClick={() => onRemove(route.id, emp.id)} className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: "rgba(239,68,68,.08)", color: "#dc2626" }}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + add */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Add employees</p>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 mb-2"
          value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or address…"
        />
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {available.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-4">No available approved employees</p>
          ) : available.map(emp => (
            <div key={emp.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors" style={{ border: "1.5px solid #e2e8f0" }}
              onClick={() => onAssign(route.id, emp.id)}>
              <Avt name={emp.name} sz="w-8 h-8" tx="text-xs" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{emp.name}</p>
                <p className="text-xs text-slate-400 truncate">{emp.address || "—"} · {emp.shift}</p>
              </div>
              <span className="text-xs font-bold text-indigo-500">+ Add</span>
            </div>
          ))}
        </div>
      </div>

      <Btn v="secondary" className="w-full" onClick={onClose}>Done</Btn>
    </div>
  );
}

function RouteCard({ route, employees, allEmployees, onEdit, onDelete, onAssign, onRemove }) {
  const [empOpen, setEmpOpen] = useState(false);
  const assignedIds = employees.map(e => e.id);
  const shiftColors = { morning: "#f59e0b", afternoon: "#3b82f6", evening: "#8b5cf6", night: "#0ea5e9" };
  const color = shiftColors[route.shift_type] || "#5b5bd6";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="h-1.5" style={{ background: `linear-gradient(90deg,${color},${color}66)` }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 truncate">{route.name}</h3>
            {route.description && <p className="text-xs text-slate-400 truncate mt-0.5">{route.description}</p>}
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: color + "15", color }}>
            {route.shift}
          </span>
        </div>

        {(route.origin || route.destination) && (
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
            <span className="truncate">{route.origin || "—"}</span>
            <Ic n="chevR" c="w-3 h-3 text-slate-300 flex-shrink-0" />
            <span className="truncate">{route.destination || "—"}</span>
          </div>
        )}

        {/* Employee count + avatars */}
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ background: "#f8fafc" }}>
          <div className="flex -space-x-1.5">
            {employees.slice(0, 5).map(e => <Avt key={e.id} name={e.name} sz="w-6 h-6" tx="text-[9px]" />)}
            {employees.length > 5 && (
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500">+{employees.length - 5}</div>
            )}
          </div>
          <span className="text-xs font-bold text-slate-600 ml-1">{employees.length} employee{employees.length !== 1 ? "s" : ""}</span>
          <button onClick={() => setEmpOpen(true)} className="ml-auto text-xs font-bold text-indigo-500 hover:text-indigo-700">Manage</button>
        </div>

        <div className="flex gap-2">
          <Btn v="secondary" className="flex-1 text-xs py-2" onClick={onEdit}><Ic n="pen" c="w-3.5 h-3.5" />Edit</Btn>
          <button onClick={onDelete} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#fee2e2", color: "#dc2626" }}>
            <Ic n="trash" c="w-4 h-4" />
          </button>
        </div>
      </div>

      <Modal open={empOpen} onClose={() => setEmpOpen(false)} title={`Manage Employees — ${route.name}`}>
        <AssignEmployeeModal
          route={route} allEmployees={allEmployees} assignedIds={assignedIds}
          onAssign={async (rId, eId) => { await onAssign(rId, eId); }}
          onRemove={async (rId, eId) => { await onRemove(rId, eId); }}
          onClose={() => setEmpOpen(false)}
        />
      </Modal>
    </div>
  );
}

export default function PageRoutes({ toast }) {
  const [routes,    setRoutes]    = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [open,      setOpen]      = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  const blank = { name: "", description: "", shift: "09:00 AM", shift_type: "morning", origin: "", destination: "" };
  const [form, setForm] = useState(blank);

  const load = async () => {
    setLoading(true);
    const [{ data: rtsData }, { data: empData }] = await Promise.all([
      supabase.from("routes").select("*, route_employees(employee_id, employees(id, name, address, shift, status))").order("name"),
      supabase.from("employees").select("*").eq("status", "approved").order("name"),
    ]);
    const routes = (rtsData || []).map(r => ({
      ...r,
      employees: (r.route_employees || []).map(re => re.employees).filter(Boolean),
    }));
    setRoutes(routes);
    setEmployees(empData || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(blank); setError(""); setOpen(true); };
  const openEdit   = r  => { setEditing(r); setForm({ name: r.name, description: r.description || "", shift: r.shift, shift_type: r.shift_type || "morning", origin: r.origin || "", destination: r.destination || "" }); setError(""); setOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Route name is required."); return; }
    setSaving(true); setError("");
    try {
      if (editing) {
        await supabase.from("routes").update({ name: form.name, description: form.description, shift: form.shift, shift_type: form.shift_type, origin: form.origin, destination: form.destination }).eq("id", editing.id);
        toast("Route updated ✓", "success");
      } else {
        const id = "RT" + uid();
        await supabase.from("routes").insert({ id, ...form });
        toast("Route created ✓", "success");
      }
      setOpen(false); load();
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await supabase.from("routes").delete().eq("id", id);
    toast("Route deleted", "info"); load();
  };

  const handleAssign = async (routeId, employeeId) => {
    await supabase.from("route_employees").upsert({ route_id: routeId, employee_id: employeeId }, { onConflict: "route_id,employee_id" });
    await supabase.from("employees").update({ route_id: routeId }).eq("id", employeeId);
    load();
  };

  const handleRemove = async (routeId, employeeId) => {
    await supabase.from("route_employees").delete().eq("route_id", routeId).eq("employee_id", employeeId);
    await supabase.from("employees").update({ route_id: null }).eq("id", employeeId);
    load();
  };

  return (
    <div className="space-y-5 max-w-[1400px]">
      <PageHeader title="Routes" sub="Standalone routes — assign employees to routes. Routes are independent of cars and drivers.">
        <Btn onClick={openCreate}><Ic n="plus" c="w-4 h-4" />New Route</Btn>
      </PageHeader>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>
      ) : routes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <Ic n="map" c="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="font-bold text-slate-400">No routes yet</p>
          <p className="text-sm text-slate-300 mt-1">Create routes, then assign employees. Drivers are selected when creating a trip.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {routes.map(r => (
            <RouteCard key={r.id} route={r} employees={r.employees || []} allEmployees={employees}
              onEdit={() => openEdit(r)} onDelete={() => handleDelete(r.id)}
              onAssign={handleAssign} onRemove={handleRemove} />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Route" : "New Route"}>
        <RouteForm form={form} setForm={setForm} onSave={handleSave} onClose={() => setOpen(false)} saving={saving} error={error} />
      </Modal>
    </div>
  );
}
