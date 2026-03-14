// ═══════════════════════════════════════════════════════════════
//  src/lib/db.js  — All Supabase DB operations
// ═══════════════════════════════════════════════════════════════
import { supabase } from "./supabase";

export const db = {

  // ─── EMPLOYEES ───────────────────────────────────────────────
  employees: {
    async list() {
      const { data, error } = await supabase
        .from("employees")
        .select("*, routes!employees_route_id_fkey(id, name, shift)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    async get(id) {
      const { data, error } = await supabase
        .from("employees").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    async create(payload) {
      const { data, error } = await supabase
        .from("employees").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, payload) {
      const { data, error } = await supabase
        .from("employees").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    async setStatus(id, status) { return db.employees.update(id, { status }); },
    async assignRoute(id, routeId, status = "approved") {
      return db.employees.update(id, { route_id: routeId, status });
    },
  },

  // ─── DRIVERS ─────────────────────────────────────────────────
  drivers: {
    async list() {
      const { data, error } = await supabase
        .from("drivers")
        .select("*, cars!drivers_car_id_fkey(number, type, capacity)")
        .order("name");
      if (error) throw error;
      return data;
    },
    async create(payload) {
      const { data, error } = await supabase
        .from("drivers").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, payload) {
      const { data, error } = await supabase
        .from("drivers").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase.from("drivers").delete().eq("id", id);
      if (error) throw error;
    },
  },

  // ─── CARS ────────────────────────────────────────────────────
  cars: {
    async list() {
      const { data, error } = await supabase
        .from("cars")
        .select("*, drivers!cars_driver_id_fkey(id, name, status, phone)")
        .order("id");
      if (error) throw error;
      return data;
    },
    async create(payload) {
      const { data, error } = await supabase
        .from("cars").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, payload) {
      const { data, error } = await supabase
        .from("cars").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase.from("cars").delete().eq("id", id);
      if (error) throw error;
    },
  },

  // ─── ROUTES (standalone — no car/driver FK) ──────────────────
  routes: {
    async list() {
      const { data, error } = await supabase
        .from("routes").select("*").order("name");
      if (error) throw error;
      return data;
    },
    async listWithEmployees() {
      const { data, error } = await supabase
        .from("routes")
        .select("*, route_employees(employee_id, employees(id, name, address, shift, status))")
        .order("name");
      if (error) throw error;
      return (data || []).map(r => ({
        ...r,
        employeeIds: (r.route_employees || []).map(re => re.employee_id),
        employees:   (r.route_employees || []).map(re => re.employees).filter(Boolean),
      }));
    },
    async create(payload) {
      const { data, error } = await supabase
        .from("routes")
        .insert({ name: payload.name, shift: payload.shift, shift_type: payload.shift_type || "morning", description: payload.description || null })
        .select().single();
      if (error) throw error;
      return data;
    },
    async update(id, payload) {
      const { data, error } = await supabase
        .from("routes").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase.from("routes").delete().eq("id", id);
      if (error) throw error;
    },
    async addEmployee(routeId, employeeId) {
      const { error } = await supabase.from("route_employees")
        .insert({ route_id: routeId, employee_id: employeeId });
      if (error) throw error;
      await db.employees.update(employeeId, { route_id: routeId, status: "approved" });
    },
    async removeEmployee(routeId, employeeId) {
      const { error } = await supabase.from("route_employees")
        .delete().eq("route_id", routeId).eq("employee_id", employeeId);
      if (error) throw error;
      await db.employees.update(employeeId, { route_id: null });
    },
  },

  // ─── BOARDING REQUESTS ───────────────────────────────────────
  boardingRequests: {
    async list() {
      const { data, error } = await supabase
        .from("boarding_requests")
        .select("*, employees(id, name, address, coords, shift, phone, email, department, lat, lng)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    async create(employeeId, requestedRoute, shift) {
      const { data, error } = await supabase
        .from("boarding_requests")
        .insert({ employee_id: employeeId, requested_route: requestedRoute, shift })
        .select().single();
      if (error) throw error;
      return data;
    },
    async review(id, status, reviewedBy, rejectionReason = null) {
      const { data, error } = await supabase
        .from("boarding_requests")
        .update({ status, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString(), rejection_reason: rejectionReason })
        .eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
  },

  // ─── TRIPS ───────────────────────────────────────────────────
  trips: {
    async list() {
      const { data, error } = await supabase
        .from("trips")
        .select("*, routes(id, name, shift), drivers(id, name, phone), cars(id, number, type, capacity), trip_employees(employee_id, pickup_status, employees(id, name, address, phone))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    async listForDriver(driverId) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("trips")
        .select("*, routes(id, name, shift), cars(id, number, type, capacity)")
        .eq("driver_id", driverId)
        .or(`status.in.(scheduled,in_progress),and(status.eq.completed,ended_at.gte.${today.toISOString()})`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    async listForEmployee(employeeId) {
      const { data, error } = await supabase
        .from("trip_employees")
        .select(`
          pickup_status,
          trips!inner(
            id, status, shift_label, scheduled_at, started_at, driver_id, car_id, trip_type,
            routes(name),
            cars(number, type)
          )
        `)
        .eq("employee_id", employeeId)
        .in("trips.status", ["scheduled", "in_progress", "completed"]);
      if (error) throw error;
      return data || [];
    },
    async create(tripData, employeeIds) {
      const uid = () => Math.random().toString(36).slice(2, 7).toUpperCase();
      const tripId = "T" + uid();
      const { error: tErr } = await supabase.from("trips").insert({ id: tripId, ...tripData });
      if (tErr) throw tErr;
      if (employeeIds && employeeIds.length > 0) {
        const rows = employeeIds.map(emp_id => ({ trip_id: tripId, employee_id: emp_id, pickup_status: "pending" }));
        const { error: eErr } = await supabase.from("trip_employees").insert(rows);
        if (eErr) throw eErr;
      }
      return tripId;
    },
    async updateStatus(id, status, extra = {}) {
      const { error } = await supabase.from("trips").update({ status, ...extra }).eq("id", id);
      if (error) throw error;
    },
    async updatePassengerStatus(tripId, employeeId, pickupStatus) {
      const { error } = await supabase.from("trip_employees")
        .update({ pickup_status: pickupStatus })
        .eq("trip_id", tripId).eq("employee_id", employeeId);
      if (error) throw error;
    },
  },

  // ─── TRACKING ────────────────────────────────────────────────
  tracking: {
    async getLatestPositions() {
      const { data, error } = await supabase.from("vw_driver_last_location").select("*");
      if (error) throw error;
      return data;
    },
    async publish(driverId, routeId, lat, lng, speedKmh, headingDeg) {
      const { error } = await supabase.from("tracking_events").insert({
        driver_id: driverId, route_id: routeId, lat, lng,
        speed_kmh: speedKmh, heading_deg: headingDeg, event_type: "ping",
      });
      if (error) throw error;
    },
  },

  // ─── NOTIFICATIONS ───────────────────────────────────────────
  notifications: {
    async list(recipientId) {
      const { data, error } = await supabase
        .from("notifications").select("*").eq("recipient_id", recipientId)
        .order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data;
    },
    async markRead(id) {
      const { error } = await supabase.rpc("mark_notification_read", { p_id: id });
      if (error) throw error;
    },
    async unreadCount(recipientId) {
      const { count, error } = await supabase
        .from("notifications").select("*", { count: "exact", head: true })
        .eq("recipient_id", recipientId).eq("is_read", false);
      if (error) throw error;
      return count;
    },
  },

  // ─── DASHBOARD STATS ─────────────────────────────────────────
  stats: {
    async get() {
      const { data, error } = await supabase.from("vw_dashboard_stats").select("*").single();
      if (error) throw error;
      return data;
    },
  },
};
