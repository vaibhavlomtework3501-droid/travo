// ═══════════════════════════════════════════════════════════════
//  src/pages/PageTracking.jsx
//  Live Tracking — trip-based (fetches in_progress + scheduled trips)
//  Each tracked vehicle = one trip (trip.id, route_id, driver_id,
//  car_id, trip_type, trip_employees)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../lib/supabase";
import {
  ROUTE_WAYPOINTS, ROUTE_COLORS, HQ,
  subscribeToVehicles, interpolatePosition,
} from "../services/gpsService";
import { Ic, Avt } from "../components/UI";

// ── Fix Leaflet default icons (Vite bundler) ───────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Vehicle SVG marker ─────────────────────────────────────────
function makeVehicleIcon(color, bearing, status, tripType) {
  const arrived = status === "arrived";
  const isDrop  = tripType === "drop";
  const uid     = color.replace("#", "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <defs>
      <filter id="sh${uid}">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="${color}" flood-opacity="0.45"/>
      </filter>
    </defs>
    <g transform="translate(22,22) rotate(${arrived ? 0 : bearing})">
      ${!arrived ? `<circle r="19" fill="${color}" opacity="0.13"/>` : ""}
      <circle r="13" fill="${arrived ? "#94a3b8" : color}" stroke="white" stroke-width="2.5"
        filter="url(#sh${uid})"/>
      ${arrived
        ? `<path d="M-5,1 L-1,5.5 L6,-4.5" stroke="white" stroke-width="2.2" fill="none"
             stroke-linecap="round" stroke-linejoin="round"/>`
        : isDrop
          ? `<path d="M0,-7 C-4,-3 -4,3 0,6 C4,3 4,-3 0,-7Z" fill="white" opacity="0.95"/>
             <circle cx="0" cy="-1" r="2.5" fill="${color}"/>`
          : `<polygon points="0,-7 4,3 0,0.5 -4,3" fill="white" opacity="0.95"/>`
      }
    </g>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, -26] });
}

// ── HQ icon ────────────────────────────────────────────────────
const HQ_ICON = L.divIcon({
  html: `<div style="width:36px;height:36px;border-radius:10px;background:#1e293b;border:2.5px solid white;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:10px;box-shadow:0 4px 14px rgba(0,0,0,0.35);font-family:sans-serif;letter-spacing:0.5px;">HQ</div>`,
  className: "", iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -22],
});

// ── Waypoint dot ───────────────────────────────────────────────
const makeWpIcon = (color) => L.divIcon({
  html: `<div style="width:9px;height:9px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.22);"></div>`,
  className: "", iconSize: [9, 9], iconAnchor: [4.5, 4.5],
});

// ── Alert types ────────────────────────────────────────────────
const ALERT_TYPES = [
  { type: "speeding",  msg: "Speed exceeded 65 km/h",  sev: "warn"  },
  { type: "delay",     msg: "Route delay detected",     sev: "warn"  },
  { type: "stop",      msg: "Unexpected stop > 2 min",  sev: "info"  },
  { type: "breakdown", msg: "Engine warning signal",    sev: "error" },
];

// ── FlyTo ──────────────────────────────────────────────────────
function FlyTo({ pos }) {
  const map = useMap();
  useEffect(() => { if (pos) map.flyTo(pos, 14, { duration: 1.2 }); }, [pos, map]);
  return null;
}

// ── Trip type badge ────────────────────────────────────────────
function TripTypeBadge({ type }) {
  const isPickup = type === "pickup";
  return (
    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
      style={{
        background: isPickup ? "rgba(91,91,214,.1)"  : "rgba(16,185,129,.1)",
        color:      isPickup ? "#5b5bd6"              : "#059669",
        border:     `1px solid ${isPickup ? "rgba(91,91,214,.25)" : "rgba(16,185,129,.25)"}`,
      }}>
      {isPickup ? "🚐 PICKUP" : "🏠 DROP"}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
export default function PageTracking({ routes, drivers, cars, emp, user }) {
  const isAdmin = user?.role === "Super Admin";

  const [trips,      setTrips]      = useState([]);
  const [tripsLoad,  setTripsLoad]  = useState(true);
  const [locations,  setLocations]  = useState({});
  const [selected,   setSelected]   = useState(null);
  const [isLive,     setIsLive]     = useState(true);
  const [alerts,     setAlerts]     = useState([]);
  const [mapFilter,  setMapFilter]  = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showEmp,    setShowEmp]    = useState(false);
  const unsubRef = useRef(null);

  // ── Load active trips ───────────────────────────────────────
  const loadTrips = useCallback(async () => {
    setTripsLoad(true);
    const { data, error } = await supabase
      .from("trips")
      .select(`
        id, route_id, driver_id, car_id, status, trip_type,
        scheduled_at, started_at, shift_label,
        routes(id, name, shift),
        drivers(id, name, phone),
        cars(id, number, type, capacity),
        trip_employees(employee_id, pickup_status,
          employees(id, name, address, shift, phone))
      `)
      .in("status", ["scheduled", "in_progress"])
      .order("created_at", { ascending: false });

    if (error) console.error("Trips load error:", error.message);
    const loaded = data || [];
    setTrips(loaded);
    setTripsLoad(false);

    // Init GPS locations for new trips
    setLocations(prev => {
      const next = { ...prev };
      loaded.forEach(t => {
        const vid = `vehicle-${t.id}`;
        if (next[vid]) return;
        const wp = ROUTE_WAYPOINTS[t.route_id];
        if (!wp) return;
        const progress = t.status === "in_progress"
          ? 0.1 + Math.random() * 0.5
          : 0.02 + Math.random() * 0.08;
        const pos = interpolatePosition(wp, progress);
        next[vid] = {
          lat: pos.lat, lng: pos.lng,
          speed: t.status === "in_progress" ? Math.round(25 + Math.random() * 35) : 0,
          bearing: 45, progress, status: "moving", ts: Date.now(),
        };
      });
      return next;
    });
  }, []);

  useEffect(() => { if (isAdmin) loadTrips(); }, [isAdmin, loadTrips]);

  // ── GPS subscription ────────────────────────────────────────
  useEffect(() => {
    if (!isLive || trips.length === 0) return;
    const ids = trips.map(t => `vehicle-${t.id}`);

    unsubRef.current = subscribeToVehicles(ids, (vid, data) => {
      setLocations(prev => ({ ...prev, [vid]: data }));
      if (Math.random() < 0.04) {
        const tripId = vid.replace("vehicle-", "");
        const trip   = trips.find(t => t.id === tripId);
        const at     = ALERT_TYPES[Math.floor(Math.random() * ALERT_TYPES.length)];
        setAlerts(a => [{
          id: Date.now() + Math.random(), tripId,
          tripName: trip?.routes?.name || tripId,
          tripType: trip?.trip_type || "pickup",
          routeId:  trip?.route_id  || "",
          ...at, time: new Date(),
        }, ...a].slice(0, 20));
      }
    });
    return () => { unsubRef.current?.(); };
  }, [isLive, trips.length]);

  const toggleLive = () => { if (isLive) unsubRef.current?.(); setIsLive(o => !o); };

  const resetAll = () => {
    const fresh = {};
    trips.forEach(t => {
      const wp = ROUTE_WAYPOINTS[t.route_id]; if (!wp) return;
      const pos = interpolatePosition(wp, 0.03);
      fresh[`vehicle-${t.id}`] = {
        lat: pos.lat, lng: pos.lng, speed: 0,
        bearing: 0, progress: 0.03, status: "moving", ts: Date.now(),
      };
    });
    setLocations(fresh);
    setAlerts([]);
  };

  const tripColor = (t) => ROUTE_COLORS[t?.route_id] || "#6366f1";

  const visibleTrips = trips.filter(t => {
    if (mapFilter  !== "all" && mapFilter  !== t.id)         return false;
    if (typeFilter !== "all" && typeFilter !== t.trip_type)  return false;
    return true;
  });

  const allLocs   = Object.values(locations);
  const moving    = allLocs.filter(l => l.status === "moving").length;
  const arrived   = allLocs.filter(l => l.status === "arrived").length;
  const newAlerts = alerts.filter(a => Date.now() - a.time.getTime() < 30000).length;
  const selLoc    = selected ? locations[`vehicle-${selected}`] : null;
  const flyPos    = selLoc ? [selLoc.lat, selLoc.lng] : null;

  // ── Access guard ────────────────────────────────────────────
  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
        <Ic n="lock" c="w-8 h-8 text-red-400"/>
      </div>
      <h2 className="text-xl font-black text-slate-700">Admin Access Only</h2>
      <p className="text-slate-400 text-sm max-w-xs">Live Tracking is restricted to Super Admin accounts.</p>
    </div>
  );

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2.5">
            Live Tracking
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full
              ${isLive ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}/>
              {isLive ? "LIVE" : "PAUSED"}
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Trip-based · {trips.length} active trip{trips.length !== 1 ? "s" : ""} · OpenStreetMap
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {[["all","All Types"],["pickup","🚐 Pickup"],["drop","🏠 Drop"]].map(([t,l]) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                  ${typeFilter===t ? "bg-indigo-600 text-white shadow" : "text-slate-500 hover:text-slate-700"}`}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={loadTrips}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm transition-all">
            <Ic n="refresh" c={`w-4 h-4 ${tripsLoad ? "animate-spin" : ""}`}/>Refresh
          </button>
          <button onClick={toggleLive}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border
              ${isLive ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                       : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"}`}>
            <Ic n={isLive ? "pause" : "play"} c="w-4 h-4"/>
            {isLive ? "Pause" : "Resume"}
          </button>
          <button onClick={resetAll}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm transition-all">
            <Ic n="refresh" c="w-4 h-4"/>Reset
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Active Trips", val:trips.length, col:"from-indigo-500 to-indigo-700",  icon:"truck" },
          { label:"Moving",       val:moving,        col:"from-emerald-500 to-teal-600",   icon:"speed" },
          { label:"Arrived",      val:arrived,       col:"from-blue-500 to-blue-700",      icon:"check" },
          { label:"Live Alerts",  val:newAlerts,     col:"from-rose-500 to-orange-600",    icon:"warn"  },
        ].map(s => (
          <div key={s.label}
            className={`bg-gradient-to-br ${s.col} rounded-2xl p-4 text-white shadow-lg hover:scale-[1.02] transition-all`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">{s.label}</span>
              <Ic n={s.icon} c="w-4 h-4 text-white/50"/>
            </div>
            <p className="text-3xl font-black">{s.val}</p>
          </div>
        ))}
      </div>

      {/* ── No trips banner ── */}
      {!tripsLoad && trips.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <Ic n="warn" c="w-5 h-5 text-amber-500 flex-shrink-0"/>
          <div>
            <p className="text-sm font-black text-amber-800">No active trips right now</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Go to <strong>Trips</strong> and create a trip with status <em>Scheduled</em> or <em>In Progress</em>.
            </p>
          </div>
        </div>
      )}

      {/* ── Map + Sidebar ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* MAP */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Ic n="locate" c="w-4 h-4 text-indigo-500"/>
              <span className="font-black text-slate-800 text-sm">Fleet Map</span>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                OpenStreetMap · Varanasi
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={() => setMapFilter("all")}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all
                  ${mapFilter==="all" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                All
              </button>
              {trips.map(t => (
                <button key={t.id}
                  onClick={() => { setMapFilter(t.id); setSelected(t.id); }}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1
                    ${mapFilter===t.id ? "text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  style={mapFilter===t.id ? {background:tripColor(t)} : {}}>
                  {t.trip_type === "pickup" ? "🚐" : "🏠"} {t.id}
                </button>
              ))}
            </div>
          </div>

          <div style={{height:"460px"}}>
            <MapContainer center={[25.3176, 83.0100]} zoom={11}
              style={{height:"100%",width:"100%"}} scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19}
              />
              {flyPos && <FlyTo pos={flyPos}/>}

              {/* HQ */}
              <Marker position={[HQ.lat, HQ.lng]} icon={HQ_ICON}>
                <Popup>
                  <div style={{fontFamily:"'DM Sans',sans-serif",textAlign:"center",padding:"4px 8px"}}>
                    <p style={{fontWeight:900,color:"#1e293b",fontSize:"13px",marginBottom:"2px"}}>Head Office</p>
                    <p style={{color:"#94a3b8",fontSize:"11px"}}>Varanasi Cantonment, UP</p>
                  </div>
                </Popup>
              </Marker>

              {/* Route lines + stops */}
              {visibleTrips.map(t => {
                const wp  = ROUTE_WAYPOINTS[t.route_id];
                if (!wp) return null;
                const col = tripColor(t);
                const pts = wp.map(p => [p.lat, p.lng]);
                return (
                  <span key={`route-${t.id}`}>
                    <Polyline positions={pts} pathOptions={{color:col, weight:9, opacity:0.10}}/>
                    <Polyline positions={pts} pathOptions={{color:col, weight:3, opacity:0.65, dashArray:"11 7"}}/>
                    {wp.map((pt, i) => (
                      <Marker key={i} position={[pt.lat, pt.lng]} icon={makeWpIcon(col)}>
                        <Popup>
                          <div style={{fontFamily:"sans-serif",fontSize:"11px"}}>
                            <strong style={{color:"#334155"}}>{pt.label}</strong><br/>
                            <span style={{color:"#94a3b8"}}>Stop {i+1} · {t.routes?.name||t.route_id} ({t.id})</span>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </span>
                );
              })}

              {/* Vehicle markers */}
              {visibleTrips.map(t => {
                const vid  = `vehicle-${t.id}`;
                const loc  = locations[vid];
                if (!loc) return null;
                const col  = tripColor(t);
                const icon = makeVehicleIcon(col, loc.bearing, loc.status, t.trip_type);
                const passengers  = t.trip_employees?.length || 0;
                const pickedCount = t.trip_employees?.filter(te =>
                  te.pickup_status==="picked"||te.pickup_status==="dropped"
                ).length || 0;
                const simPicked   = Math.min(Math.round(loc.progress * passengers), passengers);
                const displayed   = pickedCount > 0 ? pickedCount : simPicked;
                return (
                  <Marker key={vid} position={[loc.lat, loc.lng]} icon={icon}
                    eventHandlers={{ click: () => setSelected(t.id === selected ? null : t.id) }}>
                    <Popup>
                      <div style={{minWidth:"200px",fontFamily:"'DM Sans',sans-serif",padding:"2px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px",
                          paddingBottom:"8px",borderBottom:"1px solid #f1f5f9"}}>
                          <div style={{width:"10px",height:"10px",borderRadius:"50%",background:col,flexShrink:0}}/>
                          <span style={{fontWeight:900,color:"#0f172a",fontSize:"13px"}}>
                            {t.routes?.name||t.route_id}
                          </span>
                          <span style={{fontSize:"10px",fontWeight:700,padding:"1px 6px",borderRadius:"99px",
                            color:t.trip_type==="pickup"?"#5b5bd6":"#059669",
                            background:t.trip_type==="pickup"?"rgba(91,91,214,.1)":"rgba(16,185,129,.1)"}}>
                            {t.trip_type==="pickup"?"🚐 PICKUP":"🏠 DROP"}
                          </span>
                        </div>
                        <table style={{width:"100%",borderCollapse:"collapse",fontSize:"11px"}}>
                          {[
                            ["Trip",       t.id],
                            ["Driver",     t.drivers?.name||"—"],
                            ["Vehicle",    t.cars?.number||"—"],
                            ["Speed",      `${loc.speed} km/h`],
                            ["Passengers", `${displayed}/${passengers}`],
                            ["Progress",   `${Math.round(loc.progress*100)}%`],
                            ["Status",     loc.status.charAt(0).toUpperCase()+loc.status.slice(1)],
                          ].map(([k,v]) => (
                            <tr key={k}>
                              <td style={{color:"#94a3b8",padding:"3px 8px 3px 0",fontWeight:600,whiteSpace:"nowrap"}}>{k}</td>
                              <td style={{color:"#334155",fontWeight:700}}>{v}</td>
                            </tr>
                          ))}
                        </table>
                        {t.drivers?.phone && (
                          <div style={{marginTop:"10px",padding:"6px 10px",background:col,
                            borderRadius:"8px",color:"white",fontSize:"12px",fontWeight:700,textAlign:"center"}}>
                            📞 {t.drivers.phone}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="flex flex-col gap-4">

          {/* Trip list */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <span className="font-black text-slate-800 text-sm">Active Trips</span>
              <span className="text-[10px] font-bold bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full">
                {trips.length} trips
              </span>
            </div>
            <div className="overflow-y-auto" style={{maxHeight:"220px"}}>
              {tripsLoad && (
                <div className="py-8 flex justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"/>
                </div>
              )}
              {!tripsLoad && trips.length === 0 && (
                <div className="py-8 text-center text-slate-300 text-sm">No active trips</div>
              )}
              {trips.map(t => {
                const vid  = `vehicle-${t.id}`;
                const loc  = locations[vid];
                const col  = tripColor(t);
                const pct  = loc ? Math.round(loc.progress * 100) : 0;
                const sel  = selected === t.id;
                const passengers  = t.trip_employees?.length || 0;
                const pickedCount = t.trip_employees?.filter(te =>
                  te.pickup_status==="picked"||te.pickup_status==="dropped"
                ).length || 0;
                const simPicked   = loc ? Math.min(Math.round(loc.progress*passengers),passengers) : 0;
                const displayed   = pickedCount > 0 ? pickedCount : simPicked;
                return (
                  <div key={t.id} onClick={() => setSelected(sel ? null : t.id)}
                    className={`px-4 py-3 border-b border-slate-50 last:border-0 cursor-pointer transition-all
                      ${sel ? "bg-indigo-50" : "hover:bg-slate-50"}`}
                    style={sel ? {borderLeft:`3px solid ${col}`} : {borderLeft:"3px solid transparent"}}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[15px] flex-shrink-0"
                          style={{background:col+"20", border:`1.5px solid ${col}44`}}>
                          {t.trip_type==="pickup" ? "🚐" : "🏠"}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 leading-tight truncate max-w-[110px]">
                            {t.routes?.name || t.route_id}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[9px] text-slate-400">{t.drivers?.name || "—"}</span>
                            <span className="text-[9px] text-slate-300">·</span>
                            <span className="font-mono text-[9px] text-slate-300">{t.id}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0
                        ${loc?.status==="moving"  ? "bg-emerald-100 text-emerald-600"
                          : loc?.status==="arrived" ? "bg-blue-100 text-blue-600"
                          : "bg-slate-100 text-slate-500"}`}>
                        {loc?.status || "idle"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{width:`${pct}%`, background:col}}/>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 w-7 text-right">{pct}%</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-slate-400">
                        {t.trip_type==="pickup"?"picked":"dropped"}: {displayed}/{passengers}
                      </span>
                      <span className="text-[10px] font-bold" style={{color:col}}>
                        {loc?.speed||0} km/h
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected trip detail panel */}
          {selected && (() => {
            const t   = trips.find(x => x.id === selected);
            const loc = locations[`vehicle-${selected}`];
            const col = tripColor(t);
            if (!t || !loc) return null;
            const passengers  = t.trip_employees?.length || 0;
            const pickedCount = t.trip_employees?.filter(te =>
              te.pickup_status==="picked"||te.pickup_status==="dropped"
            ).length || 0;
            const simPicked  = Math.min(Math.round(loc.progress*passengers),passengers);
            const displayed  = pickedCount > 0 ? pickedCount : simPicked;
            return (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-4 py-3 border-b flex items-center gap-2"
                  style={{background:col+"14", borderColor:col+"30"}}>
                  <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{background:col}}/>
                  <span className="font-black text-slate-800 text-sm truncate flex-1">
                    {t.routes?.name || t.route_id}
                  </span>
                  <TripTypeBadge type={t.trip_type}/>
                </div>
                <div className="p-4 grid grid-cols-2 gap-2">
                  {[
                    ["Trip ID",    t.id,                                   "font-mono text-[10px] text-slate-500"],
                    ["Driver",     t.drivers?.name  || "—",                "text-slate-700"],
                    ["Car No.",    t.cars?.number    || "—",                "font-mono text-[10px] text-slate-700"],
                    ["Speed",      `${loc.speed} km/h`,                    loc.speed>60?"text-red-500 font-black":"text-emerald-600"],
                    ["Passengers", `${displayed}/${passengers}`,            "text-slate-700"],
                    ["Progress",   `${Math.round(loc.progress*100)}%`,      "text-indigo-600 font-black"],
                    ["GPS Status", loc.status,                             loc.status==="arrived"?"text-blue-600":"text-emerald-600"],
                    ["Updated",    new Date(loc.ts).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"}), "text-[10px] text-slate-400"],
                  ].map(([k,v,tc]) => (
                    <div key={k} className="bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{k}</p>
                      <p className={`text-xs font-bold mt-0.5 leading-snug truncate ${tc}`}>{v}</p>
                    </div>
                  ))}
                </div>

                {/* Inline passenger list */}
                {passengers > 0 && (
                  <div className="px-4 pb-3">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">Passengers</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {t.trip_employees.map((te, i) => {
                        const isDone   = te.pickup_status==="picked"||te.pickup_status==="dropped";
                        const simDone  = Math.round(loc.progress*passengers) > i;
                        const done     = isDone || simDone;
                        return (
                          <div key={te.employee_id}
                            className="flex items-center gap-2 p-1.5 rounded-lg"
                            style={{
                              background: done ? "rgba(16,185,129,.06)" : "#f8fafc",
                              border: `1px solid ${done ? "rgba(16,185,129,.2)" : "#e2e8f0"}`,
                            }}>
                            <Avt name={te.employees?.name||"?"} sz="w-6 h-6" tx="text-[9px]"/>
                            <span className="text-[11px] font-semibold text-slate-700 flex-1 truncate">
                              {te.employees?.name || te.employee_id}
                            </span>
                            <span style={{color: done?"#059669":"#d97706",fontSize:"11px"}}>
                              {done ? "✓" : "⏳"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="px-4 pb-4 flex gap-2">
                  <button onClick={() => setMapFilter(selected)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                    style={{background:col}}>
                    <Ic n="locate" c="w-3.5 h-3.5"/>Focus Map
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
                    <Ic n="phone" c="w-3.5 h-3.5"/>Call Driver
                  </button>
                </div>
              </div>
            );
          })()}

          {/* GPS info card */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Ic n="signal" c="w-4 h-4 text-indigo-600"/>
              </div>
              <div>
                <p className="text-xs font-black text-indigo-800 mb-1">Connect Real GPS</p>
                <p className="text-[11px] text-indigo-500 leading-relaxed">
                  Simulated movement active. Connect real driver phones via{" "}
                  <code className="bg-indigo-100 px-1 rounded font-mono text-[10px]">gpsService.js</code>{" "}
                  — Firebase &amp; Supabase instructions inside.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Alert log ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Ic n="warn" c="w-4 h-4 text-amber-500"/>
            <span className="font-black text-slate-800 text-sm">Live Alert Log</span>
            {newAlerts > 0 && (
              <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse">
                {newAlerts} new
              </span>
            )}
          </div>
          <button onClick={() => setAlerts([])}
            className="text-xs text-slate-400 hover:text-red-500 font-semibold transition-colors">
            Clear all
          </button>
        </div>
        {alerts.length === 0
          ? <div className="py-8 text-center text-slate-300 text-sm">No alerts — all trips operating normally 🎉</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[580px]">
                <thead>
                  <tr className="bg-slate-50 text-[11px] uppercase text-slate-400 font-bold tracking-wider">
                    <th className="text-left px-5 py-2.5">Time</th>
                    <th className="text-left px-4 py-2.5">Trip</th>
                    <th className="text-left px-4 py-2.5">Type</th>
                    <th className="text-left px-4 py-2.5">Alert</th>
                    <th className="text-left px-4 py-2.5">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {alerts.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-2.5 font-mono text-xs text-slate-400">
                        {a.time.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-black px-2 py-0.5 rounded-md text-white"
                          style={{background: ROUTE_COLORS[a.routeId]||"#6366f1"}}>
                          {a.tripId}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{a.tripName}</p>
                      </td>
                      <td className="px-4 py-2.5"><TripTypeBadge type={a.tripType}/></td>
                      <td className="px-4 py-2.5 text-xs text-slate-700 font-medium">{a.msg}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border
                          ${a.sev==="error" ? "bg-red-50 text-red-600 border-red-200"
                            : a.sev==="warn" ? "bg-amber-50 text-amber-600 border-amber-200"
                            : "bg-blue-50 text-blue-600 border-blue-200"}`}>
                          {a.sev==="error"?"⚠ Critical":a.sev==="warn"?"⚡ Warning":"ℹ Info"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* ── Passenger status by trip ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Ic n="users" c="w-4 h-4 text-indigo-500"/>
            <span className="font-black text-slate-800 text-sm">Passenger Status by Trip</span>
          </div>
          <button onClick={() => setShowEmp(o => !o)}
            className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold">
            {showEmp ? "Hide" : "Show all"}
          </button>
        </div>

        {!showEmp && (
          <div className="px-5 py-3 flex flex-wrap gap-2">
            {trips.length === 0 && <p className="text-sm text-slate-300">No active trips</p>}
            {trips.map(t => {
              const loc  = locations[`vehicle-${t.id}`];
              const passengers  = t.trip_employees?.length || 0;
              const pickedCount = t.trip_employees?.filter(te=>
                te.pickup_status==="picked"||te.pickup_status==="dropped"
              ).length || 0;
              const simPicked = loc ? Math.min(Math.round(loc.progress*passengers),passengers) : 0;
              const displayed = pickedCount > 0 ? pickedCount : simPicked;
              return (
                <div key={t.id}
                  className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => setShowEmp(true)}>
                  <span>{t.trip_type==="pickup"?"🚐":"🏠"}</span>
                  <div className="w-2 h-2 rounded-full" style={{background:tripColor(t)}}/>
                  <span className="text-xs font-bold text-slate-600">{t.id}</span>
                  <span className="text-xs text-slate-400">
                    {t.trip_type==="pickup"?"picked":"dropped"}: {displayed}/{passengers}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {showEmp && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[580px]">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase text-slate-400 font-bold tracking-wider">
                  <th className="text-left px-5 py-2.5">Employee</th>
                  <th className="text-left px-4 py-2.5">Trip</th>
                  <th className="text-left px-4 py-2.5">Type</th>
                  <th className="text-left px-4 py-2.5">Address</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {trips.flatMap(t =>
                  (t.trip_employees||[]).map((te, i) => {
                    const loc  = locations[`vehicle-${t.id}`];
                    const pass = t.trip_employees.length;
                    const isDone  = te.pickup_status==="picked"||te.pickup_status==="dropped";
                    const simDone = loc && Math.round(loc.progress*pass) > i;
                    const done    = isDone || simDone;
                    const label   = t.trip_type==="pickup"
                      ? (done?"✓ Picked up":"⏳ Waiting")
                      : (done?"✓ Dropped off":"⏳ Waiting");
                    return (
                      <tr key={`${t.id}-${te.employee_id}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Avt name={te.employees?.name||"?"} sz="w-7 h-7" tx="text-xs"/>
                            <span className="font-semibold text-slate-800 text-xs">
                              {te.employees?.name||te.employee_id}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs font-black px-2 py-0.5 rounded-md text-white"
                            style={{background:tripColor(t)}}>
                            {t.id}
                          </span>
                        </td>
                        <td className="px-4 py-2.5"><TripTypeBadge type={t.trip_type}/></td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">
                          {te.employees?.address||"—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border
                            ${done
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                            {label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
                {trips.every(t=>!t.trip_employees?.length) && (
                  <tr><td colSpan={5} className="px-5 py-6 text-center text-slate-300 text-sm">
                    No passengers in active trips
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}