// ═══════════════════════════════════════════════════════════════
//  src/pages/PageDrivers.jsx  (updated)
//  Admin: Manage drivers + create portal accounts
// ═══════════════════════════════════════════════════════════════
import { useState } from "react";
import { uid } from "../data/constants";
import { supabase } from "../lib/supabase";
import { Ic, Avt, Badge, Inp, Sel, Lbl, Btn, Modal, Confirm, Card, PageHeader, Empty, SearchInp } from "../components/UI";

/* ── Driver info form (edit existing) ── */
function DForm({ form, setForm, cars, onSave, onClose }) {
  return (
    <div className="space-y-4">
      <div><Lbl>Full Name</Lbl><Inp value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Ramesh Kumar"/></div>
      <div><Lbl>License No.</Lbl><Inp value={form.license} onChange={e=>setForm(p=>({...p,license:e.target.value}))} placeholder="DL-2019-001234"/></div>
      <div><Lbl>Phone</Lbl><Inp value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+91 98765 43210"/></div>
      <div><Lbl>Assign Car</Lbl>
        <Sel value={form.carId} onChange={e=>setForm(p=>({...p,carId:e.target.value}))}>
          <option value="">— No car —</option>
          {cars.map(c => <option key={c.id} value={c.id}>{c.number} · {c.type}</option>)}
        </Sel>
      </div>
      <div><Lbl>Status</Lbl>
        <Sel value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
          <option value="active">Active</option>
          <option value="available">Available</option>
          <option value="on-leave">On Leave</option>
        </Sel>
      </div>
      <div className="flex gap-3 pt-2">
        <Btn v="secondary" className="flex-1" onClick={onClose}>Cancel</Btn>
        <Btn className="flex-1" onClick={onSave}>Save Driver</Btn>
      </div>
    </div>
  );
}

/* ── Create driver + portal account ── */
function CreateDriverForm({ cars, onSave, onClose }) {
  const [form,    setForm]    = useState({ name:"", email:"", password:"", phone:"", license:"", carId:"", status:"available" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Name, email and password are required."); return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    setError(""); setLoading(true);
    try {
      // 1. Create Supabase Auth account with driver metadata
      // Use a separate client so the admin session is NOT disturbed by signUp
      const { createClient } = await import("@supabase/supabase-js");
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false, autoRefreshToken: false, storageKey: "txp-tmp-driver-signup" } }
      );
      const { data: authData, error: authErr } = await tempClient.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { portal: "driver", name: form.name, phone: form.phone, license: form.license } },
      });
      await tempClient.auth.signOut();

      if (authErr) throw authErr;
      const userId = authData?.user?.id;
      if (!userId) throw new Error("Could not create auth account — check if email already exists.");

      // 2. Wait for trigger then check for auto-created row
      await new Promise(r => setTimeout(r, 800));
      let { data: existingDriver } = await supabase
        .from("drivers").select("id").eq("user_id", userId).maybeSingle();

      // 3. If trigger didn't fire, insert manually
      if (!existingDriver) {
        const drvId = "D" + uid();
        const { error: insErr } = await supabase.from("drivers").insert({
          id: drvId,
          user_id: userId,
          name: form.name,
          email: form.email,
          phone: form.phone,
          license: form.license || "PENDING",
          car_id: form.carId || null,
          status: form.status,
          rating: 4.5,
        });
        if (insErr) throw insErr;
      } else {
        // Trigger created row — update with full details
        await supabase.from("drivers").update({
          name: form.name,
          phone: form.phone,
          license: form.license || "PENDING",
          car_id: form.carId || null,
          status: form.status,
        }).eq("user_id", userId);
      }

      onSave(`Driver account created! Share these credentials:\nEmail: ${form.email}\nPassword: ${form.password}`);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="rounded-xl p-3 text-xs" style={{ background:"linear-gradient(135deg,rgba(16,185,129,.07),rgba(5,150,105,.05))", border:"1px solid rgba(16,185,129,.2)", color:"#065f46" }}>
        <p className="font-bold mb-0.5">Creates both a login account and driver profile</p>
        <p className="opacity-80">The driver will use the email + password to log into <span className="font-mono">/?portal=driver</span></p>
      </div>

      {error && (
        <div className="rounded-xl p-3 text-xs font-semibold" style={{ background:"#fff1f2", border:"1px solid #fecdd3", color:"#9f1239" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div><Lbl>Full Name *</Lbl><Inp value={form.name} onChange={set("name")} placeholder="Ramesh Kumar"/></div>
        <div><Lbl>Phone</Lbl><Inp value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210"/></div>
      </div>
      <div><Lbl>Email Address *</Lbl><Inp type="email" value={form.email} onChange={set("email")} placeholder="driver@company.com"/></div>
      <div><Lbl>Portal Password *</Lbl><Inp type="password" value={form.password} onChange={set("password")} placeholder="Min. 6 characters"/></div>
      <div><Lbl>License No.</Lbl><Inp value={form.license} onChange={set("license")} placeholder="DL-2019-001234"/></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Lbl>Assign Car</Lbl>
          <Sel value={form.carId} onChange={set("carId")}>
            <option value="">— No car yet —</option>
            {cars.map(c => <option key={c.id} value={c.id}>{c.number} · {c.type}</option>)}
          </Sel>
        </div>
        <div><Lbl>Status</Lbl>
          <Sel value={form.status} onChange={set("status")}>
            <option value="active">Active</option>
            <option value="available">Available</option>
            <option value="on-leave">On Leave</option>
          </Sel>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Btn v="secondary" className="flex-1" onClick={onClose}>Cancel</Btn>
        <Btn className="flex-1" onClick={handleCreate} disabled={loading}>
          {loading
            ? <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Creating…</>
            : <><Ic n="plus" c="w-4 h-4"/>Create Driver Account</>
          }
        </Btn>
      </div>
    </div>
  );
}

/* ── Credentials display modal ── */
function CredentialsModal({ message, onClose }) {
  const lines = message?.split("\n") || [];
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ background:"#f0fdf4", border:"1px solid #bbf7d0" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:"#dcfce7" }}>
            <Ic n="check" c="w-4 h-4 text-green-600"/>
          </div>
          <p className="font-bold text-green-800">Account Created Successfully</p>
        </div>
        <div className="space-y-1">
          {lines.slice(1).map((line, i) => (
            <p key={i} className="text-sm font-mono text-green-700 bg-green-100 px-3 py-1.5 rounded-lg">{line}</p>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-500">Share these credentials securely with the driver. They can log in at <span className="font-mono text-indigo-600">/?portal=driver</span></p>
      <div className="flex gap-3">
        <Btn v="secondary" className="flex-1" onClick={() => { navigator.clipboard?.writeText(lines.slice(1).join("\n")); }}>
          Copy Credentials
        </Btn>
        <Btn className="flex-1" onClick={onClose}>Done</Btn>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function PageDrivers({ drivers, setDrivers, cars, routes, toast }) {
  const [addOpen,      setAddOpen]      = useState(false);
  const [createOpen,   setCreateOpen]   = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [delConfirm,   setDelConfirm]   = useState(null);
  const [credentials,  setCredentials]  = useState(null);
  const [search,       setSearch]       = useState("");

  const ef = { name:"", license:"", phone:"", carId:"", status:"available" };
  const [form, setForm] = useState(ef);

  const openAdd  = () => { setForm(ef); setAddOpen(true); };
  const openEdit = d  => { setForm({ name:d.name, license:d.license, phone:d.phone, carId:d.carId||"", status:d.status }); setEditTarget(d); };
  const doAdd    = () => { if(!form.name.trim()) return; setDrivers(p=>[...p,{...form,id:"D"+uid(),carId:form.carId||null,routeId:null}]); toast("Driver added ✓","success"); setAddOpen(false); };
  const doEdit   = () => { setDrivers(p=>p.map(d=>d.id===editTarget.id?{...d,...form,carId:form.carId||null}:d)); toast("Driver updated ✓","success"); setEditTarget(null); };
  const doDel    = id => { setDrivers(p=>p.filter(d=>d.id!==id)); toast("Driver removed","info"); setDelConfirm(null); };

  const handleCreated = (msg) => {
    setCreateOpen(false);
    setCredentials(msg);
    toast("Driver account created ✓", "success");
    // Refresh drivers list
    setTimeout(() => window.location.reload(), 2500);
  };

  const filtered = drivers.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()));
  const statuses = ["active","available","on-leave"];
  const colorOf  = s => s === "active" ? "#10b981" : s === "available" ? "#3b82f6" : "#94a3b8";

  return (
    <div className="space-y-5 max-w-[1400px]">
      <PageHeader title="Drivers" sub="Manage drivers and their portal accounts">
        <SearchInp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search drivers…"/>
        <Btn v="secondary" onClick={openAdd}><Ic n="plus" c="w-4 h-4"/>Add (no login)</Btn>
        <Btn onClick={() => setCreateOpen(true)}>
          <Ic n="user" c="w-4 h-4"/>Create Driver + Portal Account
        </Btn>
      </PageHeader>

      {/* Driver portal link banner */}
      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background:"linear-gradient(135deg,rgba(16,185,129,.06),rgba(5,150,105,.04))", border:"1px solid rgba(16,185,129,.15)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:"linear-gradient(135deg,#10b981,#059669)" }}>
          <Ic n="truck" c="w-4 h-4 text-white"/>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">Driver Portal</p>
          <p className="text-xs text-slate-500 truncate">{window.location.origin}/?portal=driver</p>
        </div>
        <button onClick={() => { navigator.clipboard?.writeText(window.location.origin + "/?portal=driver"); toast("Link copied ✓","success"); }}
          className="text-xs font-bold px-3 py-2 rounded-xl flex-shrink-0 transition-all hover:opacity-80"
          style={{ background:"linear-gradient(135deg,#10b981,#059669)", color:"white" }}>
          Copy Link
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3 fu">
        {statuses.map(s => {
          const count = drivers.filter(d => d.status === s).length;
          const color = colorOf(s);
          return (
            <div key={s} className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: color+"0e", border:`1px solid ${color}22` }}>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }}/>
              <div>
                <p className="text-xl font-display font-black" style={{ color }}>{count}</p>
                <p className="text-[11px] font-bold text-slate-500 capitalize">{s.replace(/-/g," ")}</p>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0
        ? <Card><Empty icon="user" text="No drivers found"/></Card>
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((d, i) => {
              const car   = cars.find(c => c.id === d.carId);
              const route = routes.find(r => r.id === d.routeId);
              return (
                <div key={d.id} className={`bg-white rounded-2xl border border-slate-100 shadow-sm card-lift overflow-hidden fu d${(i%6)+1}`}>
                  <div className="h-1 w-full" style={{ background:`linear-gradient(90deg,${colorOf(d.status)},${colorOf(d.status)}88)` }}/>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <Avt name={d.name} sz="w-12 h-12" tx="text-lg"/>
                        <div>
                          <p className="font-display font-bold text-slate-800">{d.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{d.phone}</p>
                          {/* Portal account indicator */}
                          {d.user_id && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full mt-1 inline-block"
                              style={{ background:"rgba(16,185,129,.1)", color:"#059669", border:"1px solid rgba(16,185,129,.2)" }}>
                              PORTAL ACTIVE
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge s={d.status}/>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="rounded-xl p-3" style={{ background:"#f8fafc" }}>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">License</p>
                        <p className="text-xs font-bold text-slate-700 font-mono">{d.license || "—"}</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background:"#f8fafc" }}>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Vehicle</p>
                        <p className="text-xs font-bold text-slate-700 font-mono">{car?.number || "—"}</p>
                      </div>
                    </div>

                    <div className="rounded-xl p-3 mb-4" style={{ background:"#ede9fe20", border:"1px solid #ede9fe" }}>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Route</p>
                      <p className="text-xs font-bold text-indigo-600">{route?.name || "Not assigned"}</p>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={()=>openEdit(d)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all hover:brightness-95"
                        style={{ background:"#ede9fe", color:"#7c3aed" }}>
                        <Ic n="edit" c="w-3.5 h-3.5"/>Edit
                      </button>
                      <button onClick={()=>setDelConfirm(d.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all hover:brightness-95"
                        style={{ background:"#fee2e2", color:"#dc2626" }}>
                        <Ic n="trash" c="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }

      {/* Modals */}
      <Modal open={addOpen} onClose={()=>setAddOpen(false)} title="Add Driver (no portal login)">
        <DForm form={form} setForm={setForm} cars={cars} onSave={doAdd} onClose={()=>setAddOpen(false)}/>
      </Modal>
      <Modal open={createOpen} onClose={()=>setCreateOpen(false)} title="Create Driver + Portal Account">
        <CreateDriverForm cars={cars} onSave={handleCreated} onClose={()=>setCreateOpen(false)}/>
      </Modal>
      <Modal open={!!editTarget} onClose={()=>setEditTarget(null)} title="Edit Driver">
        <DForm form={form} setForm={setForm} cars={cars} onSave={doEdit} onClose={()=>setEditTarget(null)}/>
      </Modal>
      <Modal open={!!credentials} onClose={()=>setCredentials(null)} title="Driver Portal Credentials">
        <CredentialsModal message={credentials} onClose={()=>setCredentials(null)}/>
      </Modal>
      <Confirm open={!!delConfirm} msg="Remove this driver from the system?" onYes={()=>doDel(delConfirm)} onNo={()=>setDelConfirm(null)}/>
    </div>
  );
}
