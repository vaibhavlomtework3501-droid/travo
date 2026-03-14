// ═══════════════════════════════════════════════════════════════
//  GPS SERVICE  —  src/services/gpsService.js
//
//  Mode: SUPABASE REALTIME  (live postgres_changes subscription)
//  Falls back to MOCK simulation when no live data exists yet.
//
//  How it works:
//  1. Subscribes to tracking_events via Supabase Realtime channel.
//  2. On each INSERT, calls onUpdate(vehicleId, payload).
//  3. If no real pings arrive within 3s, activates mock simulation
//     so the map stays animated during development / demos.
//
//  To publish real GPS from a driver device:
//    import { publishLocation } from "../services/gpsService";
//    navigator.geolocation.watchPosition(pos => {
//      publishLocation("D001", "R01", pos.coords.latitude, pos.coords.longitude, pos.coords.speed * 3.6);
//    }, null, { enableHighAccuracy: true, maximumAge: 3000 });
// ═══════════════════════════════════════════════════════════════
import { supabase } from "../lib/supabase";

// ── Real lat/lng waypoints for each route (Varanasi) ───────────
export const ROUTE_WAYPOINTS = {
  R01: [
    { lat: 25.3420, lng: 82.9730, label: "Sarnath" },
    { lat: 25.3320, lng: 82.9680, label: "Pahadia" },
    { lat: 25.3250, lng: 82.9620, label: "Banaras Hindu University" },
    { lat: 25.3180, lng: 82.9710, label: "Lanka Crossing" },
    { lat: 25.3120, lng: 82.9760, label: "Assi Ghat" },
    { lat: 25.3080, lng: 82.9820, label: "Tulsi Ghat" },
    { lat: 25.3176, lng: 83.0100, label: "HQ Office, Varanasi Cantt" },
  ],
  R02: [
    { lat: 25.3780, lng: 82.9850, label: "Varanasi Airport, Babatpur" },
    { lat: 25.3600, lng: 82.9780, label: "Shivpur" },
    { lat: 25.3480, lng: 82.9830, label: "Kandwa Road" },
    { lat: 25.3350, lng: 82.9900, label: "Sigra" },
    { lat: 25.3260, lng: 82.9970, label: "Maldahiya" },
    { lat: 25.3200, lng: 83.0040, label: "Lahurabir" },
    { lat: 25.3176, lng: 83.0100, label: "HQ Office, Varanasi Cantt" },
  ],
  R03: [
    { lat: 25.2980, lng: 82.9980, label: "Ramnagar Fort" },
    { lat: 25.3020, lng: 83.0020, label: "Ramnagar Bazaar" },
    { lat: 25.3060, lng: 83.0060, label: "Ravidas Ghat" },
    { lat: 25.3090, lng: 83.0070, label: "Raj Ghat" },
    { lat: 25.3130, lng: 83.0090, label: "Varanasi Junction" },
    { lat: 25.3155, lng: 83.0095, label: "Cantonment Road" },
    { lat: 25.3176, lng: 83.0100, label: "HQ Office, Varanasi Cantt" },
  ],
};

export const ROUTE_COLORS = { R01: "#6366f1", R02: "#14b8a6", R03: "#f59e0b" };
export const HQ = { lat: 25.3176, lng: 83.0100 };

// ── Geometry helpers ────────────────────────────────────────────
export function interpolatePosition(waypoints, progress) {
  if (!waypoints || waypoints.length < 2) return waypoints?.[0] || HQ;
  const total  = waypoints.length - 1;
  const scaled = Math.min(progress, 0.9999) * total;
  const idx    = Math.floor(scaled);
  const t      = scaled - idx;
  const a      = waypoints[idx];
  const b      = waypoints[idx + 1] || waypoints[idx];
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

export function getBearing(waypoints, progress) {
  const total  = waypoints.length - 1;
  const scaled = Math.min(progress, 0.9999) * total;
  const idx    = Math.floor(scaled);
  const a      = waypoints[idx];
  const b      = waypoints[Math.min(idx + 1, total)];
  return (Math.atan2(b.lng - a.lng, b.lat - a.lat) * 180) / Math.PI;
}

// ── Publish a GPS ping to Supabase (call from driver device) ───
export async function publishLocation(driverId, routeId, lat, lng, speedKmh = 0, headingDeg = 0) {
  const { error } = await supabase.from("tracking_events").insert({
    driver_id:   driverId,
    route_id:    routeId,
    lat,
    lng,
    speed_kmh:   speedKmh,
    heading_deg: headingDeg,
    event_type:  "ping",
  });
  if (error) console.error("GPS publish error:", error);
}

// ── Main subscription function ──────────────────────────────────
const mockState = {};

export function subscribeToVehicles(vehicleIds, onUpdate) {
  let useMock = false;
  let mockInterval = null;
  let realtimeChannel = null;

  // Helper to start mock fallback
  const startMock = () => {
    if (mockInterval) return;
    vehicleIds.forEach(id => {
      if (!mockState[id]) mockState[id] = { progress: Math.random() * 0.3 };
    });
    mockInterval = setInterval(() => {
      vehicleIds.forEach(id => {
        const state    = mockState[id];
        const step     = 0.004 + Math.random() * 0.003;
        state.progress = Math.min(state.progress + step, 1.0);
        const routeId  = id.replace("vehicle-", "");
        const waypoints = ROUTE_WAYPOINTS[routeId];
        if (!waypoints) return;
        const pos     = interpolatePosition(waypoints, state.progress);
        const bearing = getBearing(waypoints, state.progress);
        const speed   = state.progress >= 1 ? 0 : Math.round(25 + Math.random() * 40);
        onUpdate(id, {
          lat: pos.lat, lng: pos.lng, speed, bearing,
          progress: state.progress,
          status: state.progress >= 1 ? "arrived" : "moving",
          ts: Date.now(),
        });
      });
    }, 2000);
  };

  // Start mock after 3 seconds if no real data arrives
  const mockFallbackTimer = setTimeout(() => {
    useMock = true;
    startMock();
  }, 3000);

  // Subscribe to Supabase Realtime tracking_events
  realtimeChannel = supabase
    .channel("vehicle-tracking")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "tracking_events" },
      (payload) => {
        const row = payload.new;
        // Map driver_id → vehicle-{routeId} format to match page expectations
        const vehicleId = `vehicle-${row.route_id}`;
        if (!vehicleIds.includes(vehicleId)) return;

        // Real data arrived — cancel mock fallback
        clearTimeout(mockFallbackTimer);
        if (mockInterval) { clearInterval(mockInterval); mockInterval = null; useMock = false; }

        onUpdate(vehicleId, {
          lat:      row.lat,
          lng:      row.lng,
          speed:    row.speed_kmh   || 0,
          bearing:  row.heading_deg || 0,
          progress: null,
          status:   row.event_type === "stop" ? "arrived" : "moving",
          ts:       new Date(row.recorded_at).getTime(),
        });
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    clearTimeout(mockFallbackTimer);
    if (mockInterval) clearInterval(mockInterval);
    if (realtimeChannel) supabase.removeChannel(realtimeChannel);
  };
}
