// ═══════════════════════════════════════════════════════════════
//  src/pages/PageBoarding.jsx
//  Admin: Review boarding requests — approve + assign route
//  When approved, employee is added to route_employees
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Ic, Avt, Sel, Lbl, Btn, Modal, PageHeader, Empty, SearchInp } from "../components/UI";

// Approve + Assign Route form
function ApproveForm({ req, routes, onSave, onClose }) {
  const [routeId, setRouteId] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const emp = req.employees;

  const handleSave = async () => {
    if (!routeId) { setError("Please select a route"); return; }
    setSaving(true); setError("");
    try {
      // 1. Update boarding request
      await supabase.from("boarding_requests").update({
        status: "approved", reviewed_at: new Date().toISOString(),
      }).eq("id", req.id);

      // 2. Update employee status + route
      await supabase.from("employees").update({ status: "approved", route_id: routeId }).eq("id", emp.id);

      // 3. Add to route_employees junction
      await supabase.from("route_employees")
        .upsert({ route_id: routeId, employee_id: emp.id }, { onConflict: "route_id,employee_id" });

      onSave();
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#f8fafc" }}>
        <Avt name={emp?.name || "?"} sz="w-12 h-12" tx="text-base" />
        <div>
          <p className="font-bold text-slate-800">{emp?.name}</p>
          <p className="text-xs text-slate-400">{emp?.shift} · {emp?.department || emp?.address || "—"}</p>
          {emp?.email && <p className="text-xs text-indigo-500 font-mono">{emp.email}</p>}
        </div>
      </div>

      {emp?.lat && emp?.lng && (
        <div className="rounded-xl overflow-hidden border border-slate-200">
          <iframe
            title="emp-location"
            width="100%" height="140" style={{ border: "none", display: "block" }}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${emp.lng - 0.005},${emp.lat - 0.004},${emp.lng + 0.005},${emp.lat + 0.004}&layer=mapnik&marker=${emp.lat},${emp.lng}`}
          />
          <div className="px-3 py-1.5 text-xs text-slate-400 bg-slate-50">📍 {emp.address || `${emp.lat?.toFixed(4)}, ${emp.lng?.toFixed(4)}`}</div>
        </div>
      )}

      {error && <div className="rounded-xl p-3 text-xs font-semibold" style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239" }}>{error}</div>}

      <div>
        <Lbl>Assign to Route *</Lbl>
        <Sel value={routeId} onChange={e => setRouteId(e.target.value)}>
          <option value="">— Choose a route —</option>
          {routes.map(r => (
            <option key={r.id} value={r.id}>{r.name} · {r.shift}</option>
          ))}
        </Sel>
      </div>

      <div className="flex gap-3 pt-1">
        <Btn v="secondary" className="flex-1" onClick={onClose}>Cancel</Btn>
        <Btn className="flex-1" onClick={handleSave} disabled={saving || !routeId}>
          {saving ? "Approving…" : <><Ic n="check" c="w-4 h-4" />Approve & Assign</>}
        </Btn>
      </div>
    </div>
  );
}

function RejectForm({ req, onSave, onClose }) {
  const [reason,  setReason]  = useState("");
  const [saving,  setSaving]  = useState(false);

  const handleReject = async () => {
    setSaving(true);
    await supabase.from("boarding_requests").update({ status: "rejected", rejection_reason: reason, reviewed_at: new Date().toISOString() }).eq("id", req.id);
    await supabase.from("employees").update({ status: "rejected" }).eq("id", req.employees?.id);
    onSave();
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Reject boarding request for <strong>{req.employees?.name}</strong>?</p>
      <div>
        <Lbl>Reason (optional)</Lbl>
        <textarea
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 resize-none"
          rows={3} value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Reason for rejection…"
        />
      </div>
      <div className="flex gap-3">
        <Btn v="secondary" className="flex-1" onClick={onClose}>Cancel</Btn>
        <button className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white flex items-center justify-center gap-2" style={{ background: "#dc2626" }} onClick={handleReject} disabled={saving}>
          {saving ? "Rejecting…" : <><Ic n="x" c="w-4 h-4" />Reject</>}
        </button>
      </div>
    </div>
  );
}

function RequestCard({ req, routes, onRefresh }) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen,  setRejectOpen]  = useState(false);
  const emp    = req.employees || {};
  const status = req.status;

  const statusStyle = {
    pending:  { bg: "rgba(245,158,11,.08)",  color: "#d97706", border: "rgba(245,158,11,.25)",  dot: "#f59e0b",  label: "Pending" },
    approved: { bg: "rgba(16,185,129,.08)",  color: "#059669", border: "rgba(16,185,129,.25)",  dot: "#10b981",  label: "Approved" },
    rejected: { bg: "rgba(239,68,68,.08)",   color: "#dc2626", border: "rgba(239,68,68,.2)",    dot: "#ef4444",  label: "Rejected" },
  }[status] || {};

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-start gap-4">
        <Avt name={emp.name || "?"} sz="w-11 h-11" tx="text-sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-slate-800 text-sm">{emp.name || "—"}</p>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ background: statusStyle.dot }} />{statusStyle.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{emp.email || "—"} · {emp.phone || "—"}</p>
          <p className="text-xs text-slate-400">{emp.department || ""} {emp.department && emp.shift ? "·" : ""} {emp.shift}</p>
          <p className="text-xs text-slate-500 mt-1 truncate">📍 {emp.address || "No address"}</p>
        </div>
        <div className="text-[10px] text-slate-300 whitespace-nowrap">{new Date(req.created_at).toLocaleDateString("en-IN")}</div>
      </div>

      {status === "pending" && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
          <button onClick={() => setApproveOpen(true)}
            className="flex-1 rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:brightness-95"
            style={{ background: "rgba(16,185,129,.1)", color: "#059669", border: "1px solid rgba(16,185,129,.2)" }}>
            <Ic n="check" c="w-3.5 h-3.5" />Approve & Assign Route
          </button>
          <button onClick={() => setRejectOpen(true)}
            className="flex-1 rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:brightness-95"
            style={{ background: "rgba(239,68,68,.06)", color: "#dc2626", border: "1px solid rgba(239,68,68,.15)" }}>
            <Ic n="x" c="w-3.5 h-3.5" />Reject
          </button>
        </div>
      )}

      {status === "rejected" && req.rejection_reason && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-400">Rejection reason: <span className="text-slate-600 font-medium">{req.rejection_reason}</span></p>
        </div>
      )}

      <Modal open={approveOpen} onClose={() => setApproveOpen(false)} title="Approve & Assign Route">
        <ApproveForm req={req} routes={routes} onSave={() => { setApproveOpen(false); onRefresh(); }} onClose={() => setApproveOpen(false)} />
      </Modal>
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Request">
        <RejectForm req={req} onSave={() => { setRejectOpen(false); onRefresh(); }} onClose={() => setRejectOpen(false)} />
      </Modal>
    </div>
  );
}

export default function PageBoarding({ toast }) {
  const [requests, setRequests] = useState([]);
  const [routes,   setRoutes]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("pending");
  const [search,   setSearch]   = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: reqs }, { data: rts }] = await Promise.all([
      supabase.from("boarding_requests").select("*, employees(id, name, email, phone, department, address, shift, lat, lng, status)").order("created_at", { ascending: false }),
      supabase.from("routes").select("*").order("name"),
    ]);
    setRequests(reqs || []);
    setRoutes(rts || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Hide requests where the employee is already approved — they're onboarded, no action needed
  const visibleRequests = requests.filter(r => r.employees?.status !== "approved");

  const filtered = visibleRequests
    .filter(r => filter === "all" || r.status === filter)
    .filter(r => !search || r.employees?.name?.toLowerCase().includes(search.toLowerCase()) || r.employees?.email?.toLowerCase().includes(search.toLowerCase()));

  const counts = {
    all:      visibleRequests.length,
    pending:  visibleRequests.filter(r => r.status === "pending").length,
    rejected: visibleRequests.filter(r => r.status === "rejected").length,
  };

  const FILTERS = [
    { key: "pending",  label: "Pending",  color: "#f59e0b" },
    { key: "rejected", label: "Rejected", color: "#ef4444" },
    { key: "all",      label: "All",      color: "#5b5bd6" },
  ];

  return (
    <div className="space-y-5 max-w-[1200px]">
      <PageHeader title="Boarding Requests" sub="Review employee onboarding requests — approve to assign a route">
        <div className="flex items-center gap-2">
          {counts.pending > 0 && (
            <span className="text-xs font-black px-3 py-1.5 rounded-xl" style={{ background: "rgba(245,158,11,.12)", color: "#d97706" }}>
              {counts.pending} pending
            </span>
          )}
        </div>
      </PageHeader>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: filter === f.key ? f.color + "15" : "#f8fafc", color: filter === f.key ? f.color : "#64748b", border: `1.5px solid ${filter === f.key ? f.color + "40" : "#e2e8f0"}` }}>
            {f.label}
            <span className="font-black" style={{ color: filter === f.key ? f.color : "#94a3b8" }}>{counts[f.key]}</span>
          </button>
        ))}
        <div className="ml-auto">
          <SearchInp value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…" />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <Ic n="users" c="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="font-bold text-slate-400">No {filter !== "all" ? filter : ""} requests</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(req => (
            <RequestCard key={req.id} req={req} routes={routes} onRefresh={() => { load(); toast("Updated ✓", "success"); }} />
          ))}
        </div>
      )}
    </div>
  );
}