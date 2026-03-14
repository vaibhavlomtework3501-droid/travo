// ═══════════════════════════════════════════════════════════════
//  src/pages/PageCars.jsx
//  Add Car → simultaneously creates Driver record + Auth user (Driver role)
//  Car and Driver are always linked at creation time.
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Ic, Avt, Badge, Inp, Sel, Lbl, Btn, Modal, Confirm, PageHeader, Empty } from "../components/UI";

const uid = () => Math.random().toString(36).slice(2, 7).toUpperCase();

function CarDriverForm({ form, setForm, onSave, onClose, isEdit, saving, error }) {
  const [showPass, setShowPass] = useState(false);
  return (
    <div className="space-y-5 max-h-[82vh] overflow-y-auto pr-1">
      {error && (
        <div className="rounded-xl p-3 text-xs font-semibold" style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239" }}>{error}</div>
      )}

      {/* ── Vehicle Section ── */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-lg flex items-center justify-center text-white text-[10px] font-black" style={{ background: "#0ea5e9" }}>1</span>
          Vehicle Details
        </p>
        <div className="space-y-3 p-4 rounded-2xl" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div className="grid grid-cols-2 gap-3">
            <div><Lbl>Car Number *</Lbl><Inp value={form.car_number} onChange={e => setForm(p => ({ ...p, car_number: e.target.value }))} placeholder="UP 65 CA 1234" /></div>
            <div>
              <Lbl>Car Type</Lbl>
              <Sel value={form.car_type} onChange={e => setForm(p => ({ ...p, car_type: e.target.value, car_capacity: e.target.value === "4 Seater" ? 4 : 6 }))}>
                <option>4 Seater</option><option>6 Seater</option><option>Mini Bus</option>
              </Sel>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Lbl>Capacity</Lbl><Inp type="number" min="2" max="20" value={form.car_capacity} onChange={e => setForm(p => ({ ...p, car_capacity: e.target.value }))} /></div>
            <div>
              <Lbl>Status</Lbl>
              <Sel value={form.car_status} onChange={e => setForm(p => ({ ...p, car_status: e.target.value }))}>
                <option value="available">Available</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
              </Sel>
            </div>
          </div>
        </div>
      </div>

      {/* ── Driver Section ── */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-lg flex items-center justify-center text-white text-[10px] font-black" style={{ background: "#5b5bd6" }}>2</span>
          Driver Details {isEdit ? "(leave blank = keep existing)" : "— creates portal login automatically"}
        </p>
        <div className="space-y-3 p-4 rounded-2xl" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div className="grid grid-cols-2 gap-3">
            <div><Lbl>Full Name *</Lbl><Inp value={form.drv_name} onChange={e => setForm(p => ({ ...p, drv_name: e.target.value }))} placeholder="Ramesh Kumar" /></div>
            <div><Lbl>Phone *</Lbl><Inp value={form.drv_phone} onChange={e => setForm(p => ({ ...p, drv_phone: e.target.value }))} placeholder="+91 98765 43210" /></div>
          </div>
          <div><Lbl>License Number *</Lbl><Inp value={form.drv_license} onChange={e => setForm(p => ({ ...p, drv_license: e.target.value }))} placeholder="DL-2019-001234" /></div>
          {!isEdit && (
            <>
              <div><Lbl>Email (for Driver login) *</Lbl><Inp type="email" value={form.drv_email} onChange={e => setForm(p => ({ ...p, drv_email: e.target.value }))} placeholder="driver@company.com" /></div>
              <div>
                <Lbl>Password *</Lbl>
                <div className="relative">
                  <Inp type={showPass ? "text" : "password"} value={form.drv_password} onChange={e => setForm(p => ({ ...p, drv_password: e.target.value }))} placeholder="Min 6 characters" />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <Ic n={showPass ? "eyeOff" : "eye"} c="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 ml-1">Driver logs in at <span className="font-mono">/?portal=driver</span> with these credentials</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-1 sticky bottom-0 bg-white pb-1">
        <Btn v="secondary" className="flex-1" onClick={onClose}>Cancel</Btn>
        <Btn className="flex-1" onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : <><Ic n="check" c="w-4 h-4" />{isEdit ? "Update" : "Add Car & Driver"}</>}
        </Btn>
      </div>
    </div>
  );
}

function CarCard({ car, driver, onEdit, onDelete, index }) {
  const statusColor = { active: "#10b981", available: "#3b82f6", maintenance: "#f97316" }[car.status] || "#94a3b8";
  const typeColor   = car.type === "4 Seater" ? "#5b5bd6" : car.type === "6 Seater" ? "#0ea5e9" : "#f59e0b";
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="h-1.5" style={{ background: `linear-gradient(90deg,${typeColor},${typeColor}88)` }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <span className="font-mono font-black text-slate-800 text-base block mb-1">{car.number}</span>
            <span className="text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: typeColor + "15", color: typeColor }}>{car.type}</span>
          </div>
          <Badge s={car.status} />
        </div>

        <div className="rounded-xl p-3 mb-4" style={{ background: `${typeColor}08`, border: `1px solid ${typeColor}18` }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Capacity</p>
          <p className="text-2xl font-black text-slate-700">{car.capacity} <span className="text-sm font-semibold text-slate-400">seats</span></p>
        </div>

        {driver ? (
          <div className="rounded-xl p-3 mb-4" style={{ background: "rgba(91,91,214,.05)", border: "1px solid rgba(91,91,214,.12)" }}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Assigned Driver</p>
            <div className="flex items-center gap-3">
              <Avt name={driver.name} sz="w-9 h-9" tx="text-sm" />
              <div>
                <p className="text-sm font-bold text-slate-800">{driver.name}</p>
                <p className="text-xs text-slate-400">{driver.phone || "—"}</p>
              </div>
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: driver.status === "active" ? "rgba(16,185,129,.1)" : "rgba(148,163,184,.1)", color: driver.status === "active" ? "#059669" : "#94a3b8" }}>{driver.status}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-3 mb-4 text-center text-slate-400 text-xs" style={{ background: "#f8fafc", border: "1px dashed #e2e8f0" }}>No driver assigned</div>
        )}

        <div className="flex gap-2">
          <Btn v="secondary" className="flex-1 text-xs py-2" onClick={onEdit}><Ic n="pen" c="w-3.5 h-3.5" />Edit</Btn>
          <button onClick={onDelete} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:brightness-95" style={{ background: "#fee2e2", color: "#dc2626" }}>
            <Ic n="trash" c="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PageCars({ toast, onRefreshDrivers }) {
  const [cars,    setCars]    = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState(null);
  const [delC,    setDelC]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const blank = { car_number: "", car_type: "6 Seater", car_capacity: 6, car_status: "available", drv_name: "", drv_phone: "", drv_license: "", drv_email: "", drv_password: "" };
  const [form, setForm] = useState(blank);

  const load = async () => {
    setLoading(true);
    const { data: carsData } = await supabase.from("cars").select("*, drivers!cars_driver_id_fkey(id, name, phone, status)").order("id");
    const { data: drvsData } = await supabase.from("drivers").select("*").order("name");
    setCars(carsData || []);
    setDrivers(drvsData || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(blank); setError(""); setOpen(true); };
  const openEdit   = car => {
    const drv = car.drivers;
    setEditing(car);
    setForm({ car_number: car.number, car_type: car.type, car_capacity: car.capacity, car_status: car.status, drv_name: drv?.name || "", drv_phone: drv?.phone || "", drv_license: "", drv_email: "", drv_password: "" });
    setError(""); setOpen(true);
  };

  const handleSave = async () => {
    if (!form.car_number.trim() || !form.drv_name.trim() || !form.drv_phone.trim()) {
      setError("Car number, driver name and phone are required."); return;
    }
    if (!editing && (!form.drv_email.trim() || !form.drv_password.trim() || !form.drv_license.trim())) {
      setError("Driver email, password and license are required for new entries."); return;
    }
    setSaving(true); setError("");

    try {
      if (editing) {
        // ── Edit mode: update car + driver ──────────────────────
        await supabase.from("cars").update({ number: form.car_number, type: form.car_type, capacity: parseInt(form.car_capacity), status: form.car_status }).eq("id", editing.id);
        if (editing.drivers?.id && form.drv_name) {
          await supabase.from("drivers").update({ name: form.drv_name, phone: form.drv_phone }).eq("id", editing.drivers.id);
        }
        toast("Car updated ✓", "success");
      } else {
        // ── Create mode: car + driver + auth user ───────────────
        const carId = "CAR" + uid();
        const drvId = "DRV" + uid();

        // 1. Create auth user using a SEPARATE client so admin session is NOT disturbed.
        //    We import the env vars directly and create a one-off client with its own storage key.
        const { createClient } = await import("@supabase/supabase-js");
        const tempClient = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY,
          { auth: { persistSession: false, autoRefreshToken: false, storageKey: "txp-tmp-driver-signup" } }
        );
        const { data: authData, error: authErr } = await tempClient.auth.signUp({
          email: form.drv_email.trim(),
          password: form.drv_password.trim(),
          options: { data: { portal: "driver", name: form.drv_name, phone: form.drv_phone, role: "Driver" } },
        });
        if (authErr) throw new Error("Auth error: " + authErr.message);

        // Get userId — with email confirmation OFF, authData.user is populated immediately.
        // With confirmation ON, user may be null; we attempt signIn to grab the id.
        let userId = authData.user?.id;
        if (!userId) {
          const { data: si, error: siErr } = await tempClient.auth.signInWithPassword({
            email: form.drv_email.trim(), password: form.drv_password.trim(),
          });
          if (siErr) {
            throw new Error(
              "⚠️ Email confirmation is ON in Supabase. " +
              "Go to Supabase Dashboard → Authentication → Providers → Email → turn OFF 'Confirm email' → Save. " +
              "Then delete this driver from Auth → Users and try again."
            );
          }
          userId = si.user?.id;
        }
        if (!userId) throw new Error("Could not get user ID after signup.");
        await tempClient.auth.signOut();

        // 2. Insert driver WITHOUT car_id first (avoids circular FK — car doesn't exist yet)
        const { error: drvErr } = await supabase.from("drivers").insert({
          id: drvId, user_id: userId, car_id: null,
          name: form.drv_name.trim(), phone: form.drv_phone.trim(),
          license: form.drv_license.trim(), email: form.drv_email.trim(),
          status: "available",
        });
        if (drvErr) throw drvErr;

        // 3. Insert car linked to driver (driver now exists)
        const { error: carErr } = await supabase.from("cars").insert({
          id: carId, number: form.car_number.trim(), type: form.car_type,
          capacity: parseInt(form.car_capacity), status: form.car_status,
          fuel_type: "Petrol", driver_id: drvId,
        });
        if (carErr) throw carErr;

        // 4. Link driver back to car now that car exists
        const { error: linkErr } = await supabase.from("drivers")
          .update({ car_id: carId }).eq("id", drvId);
        if (linkErr) throw linkErr;

        toast("Car & driver created ✓ — Driver can log in at /?portal=driver", "success");
      }

      setOpen(false); setForm(blank);
      load();
      if (onRefreshDrivers) onRefreshDrivers();
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const handleDelete = async () => {
    await supabase.from("cars").delete().eq("id", delC.id);
    setDelC(null); load(); toast("Car removed", "info");
  };

  return (
    <div className="space-y-5 max-w-[1400px]">
      <PageHeader title="Cars & Drivers" sub="Each car is paired with a driver. Adding a car creates the driver's portal login automatically.">
        <Btn onClick={openCreate}><Ic n="plus" c="w-4 h-4" />Add Car & Driver</Btn>
      </PageHeader>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>
      ) : cars.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <Ic n="truck" c="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="font-bold text-slate-400">No cars yet</p>
          <p className="text-sm text-slate-300 mt-1">Add a car to create the driver's login too</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cars.map((car, i) => (
            <CarCard key={car.id} car={car} driver={car.drivers} index={i}
              onEdit={() => openEdit(car)} onDelete={() => setDelC(car)} />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Car & Driver" : "Add Car & Driver"}>
        <CarDriverForm form={form} setForm={setForm} onSave={handleSave} onClose={() => setOpen(false)} isEdit={!!editing} saving={saving} error={error} />
      </Modal>

      <Confirm open={!!delC} onConfirm={handleDelete} onCancel={() => setDelC(null)}
        title="Delete Car?" message={`Remove ${delC?.number}? The driver record and login will be unlinked.`} />
    </div>
  );
}
