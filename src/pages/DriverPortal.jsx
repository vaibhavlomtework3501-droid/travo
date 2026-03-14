// ═══════════════════════════════════════════════════════════════
//  src/pages/DriverPortal.jsx
//  Driver Portal — login, today's trips list, open trip → passengers + map
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Ic } from "../components/UI";

function initials(name = "?") { return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(); }
const AVT = ["#6366f1,#8b5cf6","#0ea5e9,#06b6d4","#10b981,#059669","#f59e0b,#f97316","#ec4899,#e11d48"];
function avtGrad(name) { return AVT[(name || "?").charCodeAt(0) % AVT.length]; }

function Spinner({ dark = true }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: dark ? "#0d1117" : "#F7F8FA", fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 42, height: 42, border: `3px solid ${dark ? "#10b981" : "#5b5bd6"}`, borderTopColor: "transparent", borderRadius: "50%", animation: "dp-spin 0.8s linear infinite", margin: "0 auto 14px" }} />
        <div style={{ color: dark ? "#6B7280" : "#94A3B8", fontSize: 14, fontWeight: 600 }}>Loading Driver Portal…</div>
        <style>{`@keyframes dp-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

/* ─── Login ─── */
function DriverLogin({ onSuccess }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = async () => {
    setError(""); setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        // Give actionable messages for common Supabase 400 errors
        if (err.message?.toLowerCase().includes("email not confirmed")) {
          throw new Error("Account not confirmed. Ask your admin to disable 'Confirm email' in Supabase → Auth → Providers → Email.");
        }
        if (err.message?.toLowerCase().includes("invalid login") || err.status === 400) {
          throw new Error("Invalid email or password. Ask admin to check the credentials used when creating your account.");
        }
        throw err;
      }
      const { data: driverData, error: driverErr } = await supabase
        .from("drivers")
        .select("*, cars!drivers_car_id_fkey(number, type, capacity, status)")
        .eq("user_id", data.user.id)
        .single();
      if (driverErr || !driverData) throw new Error("Driver profile not found. Ask admin to re-create your account.");
      onSuccess(driverData);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const inp = { width: "100%", background: "rgba(255,255,255,.06)", border: "1.5px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "11px 14px", fontSize: 14, color: "white", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100dvh", background: "#0d1117", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(16,185,129,.12) 0%, transparent 60%)" }} />
      <div style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg,#10b981,#059669)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <Ic n="truck" c="w-6 h-6 text-white" />
          </div>
          <h1 style={{ color: "white", fontWeight: 900, fontSize: 22, margin: "0 0 4px" }}>Driver Portal</h1>
          <p style={{ color: "#6B7280", fontSize: 13, margin: 0 }}>Sign in to view your trips & passengers</p>
        </div>
        <div style={{ background: "rgba(255,255,255,.04)", border: "1.5px solid rgba(255,255,255,.08)", borderRadius: 20, padding: 24 }}>
          {error && <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#FCA5A5", fontWeight: 600 }}>{error}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#6B7280", marginBottom: 5 }}>Email</label>
              <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="driver@company.com"
                onFocus={e => e.target.style.borderColor = "#10b981"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#6B7280", marginBottom: 5 }}>Password</label>
              <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                onFocus={e => e.target.style.borderColor = "#10b981"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"} />
            </div>
            <button onClick={handleLogin} disabled={loading || !email || !password}
              style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "white", border: "none", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .7 : 1, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}>
              {loading ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "white", borderRadius: "50%", animation: "dp-spin .7s linear infinite" }} /> Signing in…</> : "Sign In →"}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes dp-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ─── Trip Map (Leaflet) ─── */
function TripMap({ passengers, driverId, driverPos }) {
  const mapId  = "driver-trip-map";
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const initMap = () => {
      const L = window.L;
      const el = document.getElementById(mapId);
      if (!L || !el) return;
      if (el._leaflet_id) { el._leaflet_id = null; el.innerHTML = ""; }

      const center = passengers.length > 0 && passengers[0].lat && passengers[0].lng
        ? [passengers[0].lat, passengers[0].lng]
        : [25.3176, 83.0100];

      const map = L.map(mapId, { zoomControl: true, scrollWheelZoom: false }).setView(center, 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      mapRef.current = map;

      // Passenger markers
      passengers.forEach(emp => {
        if (!emp.lat || !emp.lng) return;
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#5b5bd6,#7c3aed);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2.5px solid white;box-shadow:0 3px 10px rgba(91,91,214,.4)"><div style="width:8px;height:8px;background:white;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"></div></div>`,
          iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -34],
        });
        L.marker([emp.lat, emp.lng], { icon }).addTo(map)
          .bindPopup(`<div style="font-family:system-ui;font-size:12px;font-weight:700">${emp.name}<br><span style="font-weight:400;color:#64748B">${emp.address || ""}</span></div>`);
      });

      // Driver marker
      const drvIcon = L.divIcon({
        className: "",
        html: `<div style="width:42px;height:42px;background:linear-gradient(135deg,#10b981,#059669);border-radius:50%;border:3px solid white;box-shadow:0 4px 16px rgba(16,185,129,.5);display:flex;align-items:center;justify-content:center;font-size:18px">🚐</div>`,
        iconSize: [42, 42], iconAnchor: [21, 21],
      });
      const pos = driverPos ? [driverPos.lat, driverPos.lng] : center;
      markerRef.current = L.marker(pos, { icon: drvIcon }).addTo(map).bindPopup("📍 You are here");
    };

    if (!document.getElementById("leaflet-css")) {
      const l = document.createElement("link"); l.id = "leaflet-css"; l.rel = "stylesheet";
      l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(l);
    }
    if (window.L) initMap();
    else if (!document.getElementById("leaflet-js")) {
      const s = document.createElement("script"); s.id = "leaflet-js";
      s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.onload = initMap; document.head.appendChild(s);
    } else { const c = setInterval(() => { if (window.L) { clearInterval(c); initMap(); } }, 100); }
  }, []);

  // Update driver marker position in real-time
  useEffect(() => {
    if (driverPos && markerRef.current) {
      markerRef.current.setLatLng([driverPos.lat, driverPos.lng]);
      mapRef.current?.setView([driverPos.lat, driverPos.lng], mapRef.current.getZoom());
    }
  }, [driverPos]);

  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: "1.5px solid rgba(255,255,255,.1)" }}>
      <div id={mapId} style={{ height: 260, width: "100%" }} />
      <div style={{ background: "rgba(16,185,129,.08)", padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid rgba(16,185,129,.2)" }}>
        <span style={{ fontSize: 18 }}>🚐</span>
        <span style={{ fontSize: 12, color: "#10b981", fontWeight: 700 }}>Your location is shown on the map</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#6B7280" }}>🟣 = Passenger pickup points</span>
      </div>
    </div>
  );
}

/* ─── Single Trip Detail View ─── */
function TripDetail({ trip, driver, onBack }) {
  const [passengers, setPassengers] = useState([]);
  const [picked,     setPicked]     = useState({});
  const [dropped,    setDropped]    = useState({});
  const [loading,    setLoading]    = useState(true);
  const [gpsActive,  setGpsActive]  = useState(false);
  const [driverPos,  setDriverPos]  = useState(null);
  const watchRef = useRef(null);
  const isPickup = trip.trip_type === "pickup";

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("trip_employees")
        .select("employee_id, pickup_status, employees(id, name, phone, address, lat, lng, shift)")
        .eq("trip_id", trip.id);
      const emps = (data || []).map(te => ({ ...te.employees, pickup_status: te.pickup_status }));
      setPassengers(emps);
      const pMap = {}, dMap = {};
      (data || []).forEach(te => {
        if (te.pickup_status === "picked")   pMap[te.employee_id] = true;
        if (te.pickup_status === "dropped")  dMap[te.employee_id] = true;
      });
      setPicked(pMap); setDropped(dMap);
      setLoading(false);
    };
    load();
  }, [trip.id]);

  const startGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    setGpsActive(true);
    watchRef.current = navigator.geolocation.watchPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setDriverPos({ lat, lng });
        try {
          await supabase.from("tracking_events").insert({
            driver_id: driver.id, route_id: trip.route_id,
            lat, lng, speed_kmh: (pos.coords.speed || 0) * 3.6,
            heading_deg: pos.coords.heading || 0, event_type: "ping",
          });
        } catch (e) { console.error(e); }
      },
      err => { console.warn("GPS:", err.message); setGpsActive(false); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }, [driver.id, trip.route_id]);

  useEffect(() => {
    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current); };
  }, []);

  const startTrip = async () => {
    try {
      await supabase.from("trips").update({ status: "in_progress", started_at: new Date().toISOString() }).eq("id", trip.id);
      trip.status = "in_progress"; trip.started_at = new Date().toISOString();
      startGPS();
    } catch (err) {
      console.error("Error starting trip:", err);
      alert("Failed to start trip: " + err.message);
    }
  };

  const endTrip = async () => {
    try {
      await supabase.from("trips").update({ status: "completed", ended_at: new Date().toISOString() }).eq("id", trip.id);
      if (watchRef.current) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
      setGpsActive(false);
      onBack();
    } catch (err) {
      console.error("Error ending trip:", err);
      alert("Failed to end trip: " + err.message);
    }
  };

  const togglePassenger = async (empId) => {
    const cur = picked[empId] ? "picked" : dropped[empId] ? "dropped" : "pending";
    let next;
    if (isPickup) next = cur === "pending" ? "picked" : "pending";
    else          next = cur === "pending" ? "dropped" : "pending";

    await supabase.from("trip_employees").update({ pickup_status: next }).eq("trip_id", trip.id).eq("employee_id", empId);
    if (isPickup)  setPicked(p  => { const n = { ...p  }; next === "picked"  ? (n[empId] = true) : delete n[empId]; return n; });
    else           setDropped(p => { const n = { ...p  }; next === "dropped" ? (n[empId] = true) : delete n[empId]; return n; });
  };

  const cardStyle  = { background: "rgba(255,255,255,.04)", border: "1.5px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 16, marginBottom: 10 };
  const labelStyle = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B7280", margin: "0 0 4px" };
  const isInProgress = trip.status === "in_progress";
  const doneCount = isPickup ? Object.keys(picked).length : Object.keys(dropped).length;

  return (
    <div style={{ minHeight: "100dvh", background: "#0d1117", fontFamily: "'DM Sans',system-ui,sans-serif", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "rgba(255,255,255,.03)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,.07)", flexShrink: 0 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <Ic n="arrowL" c="w-4 h-4 text-white" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>{trip.routes?.name || trip.route_id}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 12 }}>{trip.trip_type === "pickup" ? "🚐 Pickup" : "🏠 Drop"}</span>
            {trip.shift_label && <span style={{ fontSize: 11, color: "#6B7280" }}>· {trip.shift_label}</span>}
          </div>
        </div>
        {gpsActive && (
          <span style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.3)", color: "#10b981", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "dp-live 1.5s ease-in-out infinite", display: "inline-block" }} />GPS
          </span>
        )}
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "14px 14px 80px" }}>
        {/* Trip control */}
        <div style={{ ...cardStyle, borderColor: isInProgress ? "rgba(16,185,129,.3)" : "rgba(245,158,11,.3)", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <p style={labelStyle}>Trip Status</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: isInProgress ? "#10b981" : "#f59e0b", margin: 0 }}>
                {isInProgress ? "🟢 In Progress" : trip.status === "completed" ? "✅ Completed" : "🟡 Scheduled"}
              </p>
            </div>
            {isInProgress && <span style={{ background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.2)", color: "#10b981", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>{doneCount}/{passengers.length} done</span>}
          </div>
          {trip.status === "scheduled" && (
            <button onClick={startTrip}
              style={{ width: "100%", background: "linear-gradient(135deg,#10b981,#059669)", color: "white", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Ic n="play" c="w-4 h-4" /> Start Trip
            </button>
          )}
          {isInProgress && (
            <button onClick={endTrip}
              style={{ width: "100%", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "white", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Ic n="pause" c="w-4 h-4" /> End Trip
            </button>
          )}
        </div>

        {/* Map */}
        {!loading && <div style={{ marginBottom: 12 }}><TripMap passengers={passengers} driverId={driver.id} driverPos={driverPos} /></div>}

        {/* Passenger progress bar */}
        {isInProgress && passengers.length > 0 && (
          <div style={{ background: "rgba(16,185,129,.06)", border: "1.5px solid rgba(16,185,129,.2)", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#6B7280", fontSize: 12, fontWeight: 700 }}>{isPickup ? "Pickup" : "Drop"} Progress</span>
              <span style={{ color: "#10b981", fontSize: 12, fontWeight: 800 }}>{doneCount}/{passengers.length}</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,.08)", borderRadius: 99 }}>
              <div style={{ height: "100%", width: `${passengers.length ? (doneCount / passengers.length) * 100 : 0}%`, background: "linear-gradient(90deg,#10b981,#059669)", borderRadius: 99, transition: "width .5s ease" }} />
            </div>
          </div>
        )}

        {/* Passengers */}
        <p style={{ ...labelStyle, marginBottom: 10 }}>Passengers ({passengers.length})</p>
        {loading ? (
          <div style={{ textAlign: "center", padding: 30 }}><div style={{ width: 28, height: 28, border: "2px solid #10b981", borderTopColor: "transparent", borderRadius: "50%", animation: "dp-spin .7s linear infinite", margin: "0 auto" }} /></div>
        ) : passengers.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: "#6B7280", fontSize: 13 }}>No passengers on this trip</div>
        ) : (
          passengers.map(emp => {
            const isDone = isPickup ? picked[emp.id] : dropped[emp.id];
            return (
              <div key={emp.id} style={{ ...cardStyle, borderColor: isDone ? "rgba(16,185,129,.4)" : "rgba(255,255,255,.08)", background: isDone ? "rgba(16,185,129,.06)" : "rgba(255,255,255,.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${avtGrad(emp.name)})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                    {initials(emp.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontWeight: 800, color: "white", fontSize: 14 }}>{emp.name}</span>
                      {isDone && <span style={{ background: "rgba(16,185,129,.2)", color: "#10b981", borderRadius: 6, padding: "2px 6px", fontSize: 10, fontWeight: 800 }}>{isPickup ? "PICKED" : "DROPPED"}</span>}
                    </div>
                    <p style={{ color: "#6B7280", fontSize: 12, margin: "0 0 2px" }}>{emp.address || "—"}</p>
                    <p style={{ color: "#6B7280", fontSize: 11, margin: 0 }}>⏰ {emp.shift || "09:00 AM"}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                    {isInProgress && (
                      <button onClick={() => togglePassenger(emp.id)}
                        style={{ background: isDone ? "rgba(239,68,68,.15)" : "rgba(16,185,129,.15)", border: `1px solid ${isDone ? "rgba(239,68,68,.3)" : "rgba(16,185,129,.3)"}`, color: isDone ? "#FCA5A5" : "#10b981", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                        {isDone ? "Undo" : isPickup ? "Picked Up" : "Dropped"}
                      </button>
                    )}
                    {emp.phone && (
                      <a href={`tel:${emp.phone}`} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.7)", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, textDecoration: "none", textAlign: "center", display: "block" }}>📞</a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <style>{`@keyframes dp-live{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}

/* ─── Dashboard ─── */
function DriverDashboard({ driver: initialDriver, onLogout }) {
  const [tab,      setTab]      = useState("home");
  const [driver,   setDriver]   = useState(initialDriver);
  const [trips,    setTrips]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [openTrip, setOpenTrip] = useState(null); // trip currently viewed
  const car  = driver.cars || null;
  const grad = avtGrad(driver.name);

  const loadTrips = async () => {
    setLoading(true);
    // Today's trips: scheduled or in_progress; also load recent completed ones
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("trips")
      .select("*, routes(id, name, shift)")
      .eq("driver_id", driver.id)
      .or("status.in.(scheduled,in_progress),and(status.eq.completed,ended_at.gte." + today.toISOString() + ")")
      .order("created_at", { ascending: false });
    setTrips(data || []);
    setLoading(false);
  };

  useEffect(() => { loadTrips(); }, [driver.id]);

  // If viewing a trip detail
  if (openTrip) {
    return <TripDetail trip={openTrip} driver={driver} onBack={() => { setOpenTrip(null); loadTrips(); }} />;
  }

  const cardStyle  = { background: "rgba(255,255,255,.04)", border: "1.5px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 16, marginBottom: 10 };
  const labelStyle = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B7280", margin: "0 0 4px" };

  const tripStatusChip = (status) => {
    if (status === "in_progress") return { bg: "rgba(16,185,129,.15)", color: "#10b981", label: "🟢 In Progress" };
    if (status === "completed")   return { bg: "rgba(99,102,241,.12)", color: "#6366f1", label: "✅ Completed" };
    return                               { bg: "rgba(245,158,11,.12)", color: "#f59e0b", label: "🟡 Scheduled" };
  };

  const tabs = [
    { id: "home",    icon: "grid",    label: "Home" },
    { id: "trips",   icon: "truck",   label: "My Trips" },
    { id: "profile", icon: "user",    label: "Profile" },
  ];

  return (
    <div style={{ minHeight: "100dvh", background: "#0d1117", fontFamily: "'DM Sans',system-ui,sans-serif", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ background: "rgba(255,255,255,.03)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,.07)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic n="truck" c="w-4 h-4 text-white" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "white" }}>ETRAVO</div>
            <div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Driver Portal</div>
          </div>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${grad})`, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
          {initials(driver.name)}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", paddingBottom: 80 }}>

        {/* HOME TAB */}
        {tab === "home" && (
          <div style={{ padding: "14px 14px 0" }}>
            <div style={{ background: "linear-gradient(135deg,rgba(16,185,129,.15),rgba(5,150,105,.1))", border: "1.5px solid rgba(16,185,129,.2)", borderRadius: 18, padding: 20, marginBottom: 12 }}>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: 12, fontWeight: 600, margin: "0 0 4px" }}>Welcome back,</p>
              <h2 style={{ color: "white", fontSize: 20, fontWeight: 800, margin: "0 0 10px" }}>{driver.name} 🚐</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.7)", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>{driver.id}</span>
                <span style={{ background: driver.status === "active" ? "rgba(16,185,129,.2)" : "rgba(255,255,255,.08)", color: driver.status === "active" ? "#10b981" : "rgba(255,255,255,.5)", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>{driver.status}</span>
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div style={cardStyle}>
                <p style={labelStyle}>Today's Trips</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: "white", margin: 0 }}>{trips.length}</p>
                <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>{trips.filter(t => t.status === "in_progress").length} in progress</p>
              </div>
              {car && (
                <div style={cardStyle}>
                  <p style={labelStyle}>My Vehicle</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "white", margin: "0 0 2px" }}>{car.number}</p>
                  <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>{car.type} · {car.capacity} seats</p>
                </div>
              )}
            </div>

            {/* Today's trips quick list */}
            <p style={{ ...labelStyle, marginBottom: 10 }}>Today's Trips</p>
            {loading ? (
              <div style={{ textAlign: "center", padding: 30 }}><div style={{ width: 24, height: 24, border: "2px solid #10b981", borderTopColor: "transparent", borderRadius: "50%", animation: "dp-spin .7s linear infinite", margin: "0 auto" }} /></div>
            ) : trips.length === 0 ? (
              <div style={cardStyle}><div style={{ textAlign: "center", padding: "20px 0", color: "#6B7280" }}>No trips assigned today<br /><span style={{ fontSize: 12 }}>Check back or contact admin</span></div></div>
            ) : (
              trips.slice(0, 3).map(trip => {
                const chip = tripStatusChip(trip.status);
                return (
                  <div key={trip.id} onClick={() => setOpenTrip(trip)} style={{ ...cardStyle, cursor: "pointer", transition: "border-color .15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(16,185,129,.3)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontSize: 28, flexShrink: 0 }}>{trip.trip_type === "pickup" ? "🚐" : "🏠"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: "white", fontWeight: 800, fontSize: 14, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.routes?.name || trip.route_id}</p>
                        <p style={{ color: "#6B7280", fontSize: 11, margin: 0 }}>{trip.shift_label || "—"} · {trip.trip_type === "pickup" ? "Pickup" : "Drop"}</p>
                      </div>
                      <span style={{ background: chip.bg, color: chip.color, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{chip.label}</span>
                    </div>
                  </div>
                );
              })
            )}
            {trips.length > 3 && (
              <button onClick={() => setTab("trips")} style={{ width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: "10px", fontSize: 12, color: "#6B7280", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                View all {trips.length} trips →
              </button>
            )}
          </div>
        )}

        {/* TRIPS TAB */}
        {tab === "trips" && (
          <div style={{ padding: "14px 14px 0" }}>
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "white", margin: 0 }}>Today's Trips</h2>
              <span style={{ background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.2)", color: "#10b981", borderRadius: 10, padding: "4px 12px", fontSize: 13, fontWeight: 800 }}>{trips.length}</span>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: 40 }}><div style={{ width: 32, height: 32, border: "2px solid #10b981", borderTopColor: "transparent", borderRadius: "50%", animation: "dp-spin .7s linear infinite", margin: "0 auto" }} /></div>
            ) : trips.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🚐</div>
                <p style={{ fontWeight: 700, color: "white", fontSize: 16 }}>No Trips Today</p>
                <p style={{ color: "#6B7280", fontSize: 13 }}>Admin will assign trips to you.</p>
              </div>
            ) : (
              trips.map(trip => {
                const chip = tripStatusChip(trip.status);
                return (
                  <div key={trip.id} onClick={() => setOpenTrip(trip)}
                    style={{ ...cardStyle, cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(16,185,129,.3)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ fontSize: 32, flexShrink: 0, marginTop: 2 }}>{trip.trip_type === "pickup" ? "🚐" : "🏠"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ color: "white", fontWeight: 800, fontSize: 15 }}>{trip.routes?.name || trip.route_id}</span>
                          <span style={{ background: chip.bg, color: chip.color, borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 700 }}>{chip.label}</span>
                        </div>
                        <p style={{ color: "#6B7280", fontSize: 12, margin: "0 0 4px" }}>
                          {trip.trip_type === "pickup" ? "Pickup trip" : "Drop trip"} · {trip.shift_label || "No shift label"}
                        </p>
                        {trip.scheduled_at && (
                          <p style={{ color: "#6B7280", fontSize: 11, margin: 0 }}>📅 {new Date(trip.scheduled_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                        )}
                      </div>
                      <Ic n="chevR" c="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {tab === "profile" && (
          <div style={{ padding: "14px 14px 0" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,${grad})`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 24, boxShadow: "0 8px 24px rgba(16,185,129,.3)", marginBottom: 10 }}>
                {initials(driver.name)}
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "white", margin: "0 0 4px" }}>{driver.name}</h2>
              <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>{driver.email || "—"}</p>
            </div>
            <div style={{ background: "rgba(255,255,255,.04)", border: "1.5px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 16, marginBottom: 12 }}>
              {[
                { label: "Driver ID", value: driver.id },
                { label: "License",   value: driver.license },
                { label: "Phone",     value: driver.phone },
                { label: "Status",    value: driver.status },
                { label: "Vehicle",   value: car ? `${car.number} · ${car.type}` : "Not Assigned" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                  <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "white", textAlign: "right", maxWidth: "55%" }}>{value || "—"}</span>
                </div>
              ))}
            </div>
            <button onClick={onLogout} style={{ width: "100%", background: "rgba(239,68,68,.1)", color: "#FCA5A5", border: "1.5px solid rgba(239,68,68,.25)", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Ic n="logout" c="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#0d1117", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", padding: "8px 0 10px", zIndex: 20 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "4px 0", color: tab === t.id ? "#10b981" : "#6B7280", position: "relative" }}>
            <Ic n={t.icon} c={`w-5 h-5 ${tab === t.id ? "text-emerald-400" : "text-gray-600"}`} />
            <span style={{ fontSize: 10, fontWeight: 700 }}>{t.label}</span>
            {tab === t.id && <span style={{ position: "absolute", bottom: -1, width: 24, height: 3, borderRadius: "3px 3px 0 0", background: "#10b981" }} />}
            {t.id === "trips" && trips.filter(t => t.status === "in_progress").length > 0 && tab !== "trips" && (
              <span style={{ position: "absolute", top: 4, right: "calc(50% - 14px)", width: 7, height: 7, borderRadius: "50%", background: "#10b981", animation: "dp-live 1.5s ease-in-out infinite" }} />
            )}
          </button>
        ))}
      </div>
      <style>{`@keyframes dp-live{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}

export default function DriverPortal() {
  const [state,  setState]  = useState("loading");
  const [driver, setDriver] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setState("auth"); return; }
      const { data } = await supabase.from("drivers").select("*, cars!drivers_car_id_fkey(number, type, capacity, status)").eq("user_id", session.user.id).single();
      if (data) { setDriver(data); setState("dashboard"); }
      else { setState("auth"); }
    });
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); setState("auth"); setDriver(null); };
  const handleSuccess = d => { setDriver(d); setState("dashboard"); };

  if (state === "loading") return <Spinner />;
  if (state === "auth")    return <DriverLogin onSuccess={handleSuccess} />;
  return <DriverDashboard driver={driver} onLogout={handleLogout} />;
}