// // ═══════════════════════════════════════════════════════════════
// //  src/pages/EmployeePortal.jsx
// //  Employee Portal — onboarding + dashboard
// //  Shows: pickup trip, drop trip, live driver tracking
// // ═══════════════════════════════════════════════════════════════
// import { useState, useEffect, useRef } from "react";
// import { supabase } from "../lib/supabase";
// import { Ic } from "../components/UI";

// /* ─── helpers ─── */
// function getGreeting() {
//   const h = new Date().getHours();
//   return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
// }
// function initials(n = "?") { return n.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase(); }
// const AVT = ["#6366f1,#8b5cf6","#0ea5e9,#06b6d4","#10b981,#059669","#f59e0b,#f97316","#ec4899,#e11d48"];
// function avtGrad(n) { return AVT[(n || "?").charCodeAt(0) % AVT.length]; }

// /* ─── shared styles ─── */
// const S = {
//   input: { width:"100%", background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:12, padding:"10px 14px", fontSize:14, color:"#0F172A", outline:"none", fontFamily:"inherit", boxSizing:"border-box" },
//   label: { display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#94A3B8", marginBottom:5 },
//   btn:   { width:"100%", background:"linear-gradient(135deg,#5b5bd6,#7c3aed)", color:"white", border:"none", borderRadius:12, padding:"12px 20px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8 },
//   card:  { background:"white", borderRadius:16, padding:20, boxShadow:"0 2px 12px rgba(0,0,0,.06)", marginBottom:12 },
// };

// /* ─── Spinner ─── */
// function Spinner() {
//   return (
//     <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F7F8FA", fontFamily:"'DM Sans',system-ui,sans-serif" }}>
//       <div style={{ textAlign:"center" }}>
//         <div style={{ width:42, height:42, border:"3px solid #5b5bd6", borderTopColor:"transparent", borderRadius:"50%", animation:"ep-spin 0.8s linear infinite", margin:"0 auto 14px" }}/>
//         <div style={{ color:"#94A3B8", fontSize:14, fontWeight:600 }}>Loading…</div>
//         <style>{`@keyframes ep-spin{to{transform:rotate(360deg)}}`}</style>
//       </div>
//     </div>
//   );
// }

// /* ─── Status Badge ─── */
// function StatusBadge({ status }) {
//   const MAP = {
//     pending:  { bg:"#fffbeb", color:"#92400e", border:"#fde68a", dot:"#f59e0b", label:"Pending Approval" },
//     approved: { bg:"#f0fdf4", color:"#166534", border:"#bbf7d0", dot:"#22c55e", label:"Approved" },
//     rejected: { bg:"#fff1f2", color:"#9f1239", border:"#fecdd3", dot:"#f43f5e", label:"Rejected" },
//   };
//   const s = MAP[status] || MAP.pending;
//   return (
//     <span style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}`, display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:99, fontSize:12, fontWeight:700 }}>
//       <span style={{ width:7, height:7, borderRadius:"50%", background:s.dot, display:"inline-block" }}/>{s.label}
//     </span>
//   );
// }

// /* ─── ONBOARDING FORM ─── */
// function OnboardingForm({ onSuccess }) {
//   const [step,      setStep]      = useState(1);
//   const [mode,      setMode]      = useState("signup");
//   const [form,      setForm]      = useState({ name:"", email:"", password:"", phone:"", department:"", shift:"09:00 AM", address:"", office:"Main Campus" });
//   const [loading,   setLoading]   = useState(false);
//   const [error,     setError]     = useState("");
//   const [coords,    setCoords]    = useState(null);
//   const [geoStatus, setGeoStatus] = useState("idle");

//   const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

//   const fetchGeo = () => {
//     if (!navigator.geolocation) { setGeoStatus("error"); return; }
//     setGeoStatus("fetching");
//     navigator.geolocation.getCurrentPosition(
//       pos => { setCoords({ lat: parseFloat(pos.coords.latitude.toFixed(6)), lng: parseFloat(pos.coords.longitude.toFixed(6)) }); setGeoStatus("done"); },
//       () => setGeoStatus("error"),
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   };

//   const handleAuth = async () => {
//     setError(""); setLoading(true);
//     try {
//       if (mode === "signup") {
//         // validate before moving to profile step
//         if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
//           throw new Error("Please enter a valid email address.");
//         }
//         if (!form.password || form.password.length < 6) {
//           throw new Error("Password must be at least 6 characters.");
//         }
//         setStep(2);
//         setLoading(false);
//         return;
//       }
//       const { data, error: err } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
//       if (err) throw err;
//       if (data.user) {
//         const { data: empData } = await supabase.from("employees").select("*").eq("user_id", data.user.id).single();
//         if (empData) { onSuccess(empData); return; }
//         setStep(2);
//       }
//     } catch (err) {
//       console.error("EmployeePortal.handleAuth error:", err);
//       const msg = err?.message || "Unknown error";
//       const status = err?.status ? ` (status ${err.status})` : "";
//       const details = err?.details ? `: ${err.details}` : "";
//       setError(msg + status + details);
//     }
//     setLoading(false);
//   };

//   const handleProfile = async () => {
//     if (!form.name.trim() || !form.address.trim()) { setError("Name and address are required."); return; }
//     setError(""); setLoading(true);
//     try {
//       let userId = null;
//       if (mode === "signup") {
//         if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
//           throw new Error("Please enter a valid email address.");
//         }
//         const { data, error: err } = await supabase.auth.signUp({
//           email: form.email, password: form.password
//         });
//         if (err) throw err;
//         userId = data.user?.id;
//         // If email confirmation is enabled, the user won't be signed in yet.
//         // Try to sign in to establish the session for RLS.
//         if (userId && !data.session) {
//           const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
//           if (signInErr) {
//             // If sign in fails (e.g., email not confirmed), inform the user
//             throw new Error("Account created successfully! Please check your email to confirm your account, then sign in.");
//           }
//           userId = signInData.user?.id;
//         }
//       } else {
//         const { data: { user } } = await supabase.auth.getUser();
//         userId = user?.id;
//       }
//       if (!userId) throw new Error("Authentication failed.");
//       await new Promise(r => setTimeout(r, 800));
//       let { data: empData } = await supabase.from("employees").select("*").eq("user_id", userId).single();
//       if (!empData) {
//         const empId = "EMP" + Math.random().toString(36).slice(2, 6).toUpperCase();
//         const { data: inserted, error: insErr } = await supabase.from("employees").insert({
//           id: empId, user_id: userId,
//           name: form.name, email: form.email, phone: form.phone,
//           department: form.department, shift: form.shift,
//           address: form.address, office: form.office,
//           lat: coords?.lat ?? null, lng: coords?.lng ?? null,
//           status: "pending", route_id: null,
//         }).select().single();
//         if (insErr) throw insErr;
//         empData = inserted;

//         // Auto-create boarding request so admin sees it immediately
//         await supabase.from("boarding_requests").insert({
//           employee_id: empId,
//           shift: form.shift,
//           status: "pending",
//         }).then(() => {});  // non-fatal if trigger already created it
//       }
//       onSuccess(empData);
//     } catch (err) {
//       console.error("EmployeePortal.handleProfile error:", err);
//       const msg = err?.message || "Unknown error";
//       const status = err?.status ? ` (status ${err.status})` : "";
//       const details = err?.details ? `: ${err.details}` : "";
//       setError(msg + status + details);
//     }
//     setLoading(false);
//   };

//   return (
//     <div style={{ minHeight:"100dvh", background:"linear-gradient(135deg,#0d0f14 0%,#141828 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'DM Sans',system-ui,sans-serif" }}>
//       <div style={{ position:"fixed", inset:0, pointerEvents:"none", background:"radial-gradient(ellipse 70% 50% at 30% 20%, rgba(91,91,214,.2) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 75% 80%, rgba(14,165,233,.15) 0%, transparent 60%)" }}/>
//       <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1 }}>
//         <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:32, justifyContent:"center" }}>
//           <div style={{ width:42, height:42, borderRadius:14, background:"linear-gradient(135deg,#5b5bd6,#0ea5e9)", display:"flex", alignItems:"center", justifyContent:"center" }}>
//             <Ic n="truck" c="w-5 h-5 text-white"/>
//           </div>
//           <span style={{ fontWeight:900, color:"white", fontSize:22 }}>Transport<span style={{ color:"#0ea5e9" }}>X</span></span>
//         </div>
//         <div style={{ background:"white", borderRadius:20, padding:28, boxShadow:"0 24px 80px rgba(0,0,0,.3)" }}>
//           {step === 1 ? (
//             <>
//               <div style={{ marginBottom:24 }}>
//                 <h1 style={{ fontSize:20, fontWeight:800, color:"#0F172A", margin:"0 0 6px" }}>{mode === "signup" ? "Employee Onboarding" : "Employee Login"}</h1>
//                 <p style={{ fontSize:13, color:"#94A3B8", margin:0 }}>{mode === "signup" ? "Register to request transport access" : "Sign in to your portal"}</p>
//                 <div style={{ display:"flex", marginTop:16, background:"#F1F5F9", borderRadius:10, padding:3 }}>
//                   {["signup","login"].map(m => (
//                     <button key={m} onClick={() => { setMode(m); setError(""); }}
//                       style={{ flex:1, padding:"7px 0", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit", background:mode===m?"white":"transparent", color:mode===m?"#5b5bd6":"#94A3B8", boxShadow:mode===m?"0 1px 6px rgba(0,0,0,.08)":"none" }}>
//                       {m === "signup" ? "New Employee" : "Existing Employee"}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//               {error && <div style={{ background:"#FFF1F2", border:"1px solid #FECDD3", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#9F1239", fontWeight:600 }}>{error}</div>}
//               <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
//                 <div><label style={S.label}>Email</label><input style={S.input} type="email" value={form.email} onChange={set("email")} placeholder="you@company.com" onFocus={e=>e.target.style.borderColor="#5b5bd6"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/></div>
//                 <div><label style={S.label}>Password</label><input style={S.input} type="password" value={form.password} onChange={set("password")} placeholder="Min. 6 characters" onFocus={e=>e.target.style.borderColor="#5b5bd6"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/></div>
//                 <button style={{ ...S.btn, opacity:loading?0.7:1 }} onClick={handleAuth} disabled={loading || !form.email || !form.password}>
//                   {loading ? <><div style={{ width:16,height:16,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"white",borderRadius:"50%",animation:"ep-spin .7s linear infinite" }}/> Processing…</> : mode==="signup"?"Continue →":"Sign In →"}
//                 </button>
//               </div>
//             </>
//           ) : (
//             <>
//               <div style={{ marginBottom:24 }}>
//                 <h1 style={{ fontSize:20, fontWeight:800, color:"#0F172A", margin:"0 0 6px" }}>Complete Your Profile</h1>
//                 <p style={{ fontSize:13, color:"#94A3B8", margin:0 }}>Tell us about yourself so we can assign the right route</p>
//               </div>
//               {error && <div style={{ background:"#FFF1F2", border:"1px solid #FECDD3", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#9F1239", fontWeight:600 }}>{error}</div>}
//               <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
//                 <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
//                   <div><label style={S.label}>Full Name</label><input style={S.input} value={form.name} onChange={set("name")} placeholder="Raj Kumar" onFocus={e=>e.target.style.borderColor="#5b5bd6"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/></div>
//                   <div><label style={S.label}>Phone</label><input style={S.input} value={form.phone} onChange={set("phone")} placeholder="+91 98765…" onFocus={e=>e.target.style.borderColor="#5b5bd6"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/></div>
//                 </div>
//                 <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
//                   <div><label style={S.label}>Department</label><input style={S.input} value={form.department} onChange={set("department")} placeholder="Engineering" onFocus={e=>e.target.style.borderColor="#5b5bd6"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/></div>
//                   <div><label style={S.label}>Shift</label>
//                     <select style={{ ...S.input, cursor:"pointer" }} value={form.shift} onChange={set("shift")}>
//                       <option>08:30 AM</option><option>09:00 AM</option><option>10:00 AM</option><option>02:00 PM</option>
//                     </select>
//                   </div>
//                 </div>
//                 <div>
//                   <label style={S.label}>Pickup Address</label>
//                   <input style={S.input} value={form.address} onChange={set("address")} placeholder="e.g. Sector 62, Noida" onFocus={e=>e.target.style.borderColor="#5b5bd6"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
//                   <button type="button" onClick={fetchGeo} disabled={geoStatus==="fetching"}
//                     style={{ marginTop:8, display:"flex", alignItems:"center", gap:7, background:geoStatus==="done"?"#F0FDF4":"#F8FAFF", border:`1.5px solid ${geoStatus==="done"?"#BBF7D0":geoStatus==="error"?"#FECDD3":"#C7D2FE"}`, borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:700, color:geoStatus==="done"?"#166534":geoStatus==="error"?"#9F1239":"#4F46E5", cursor:geoStatus==="fetching"?"not-allowed":"pointer", fontFamily:"inherit", width:"100%", justifyContent:"center" }}>
//                     {geoStatus==="fetching" ? <><div style={{ width:13,height:13,border:"2px solid currentColor",borderTopColor:"transparent",borderRadius:"50%",animation:"ep-spin .7s linear infinite" }}/> Fetching…</>
//                      : geoStatus==="done"    ? <>✓ Location captured — {coords.lat}, {coords.lng}</>
//                      : geoStatus==="error"   ? <>⚠ Could not get location</>
//                      : <>📍 Fetch My GPS Location</>}
//                   </button>
//                   {coords && geoStatus==="done" && (
//                     <div style={{ marginTop:10, borderRadius:12, overflow:"hidden", border:"1.5px solid #C7D2FE", height:130 }}>
//                       <iframe title="pickup-preview" width="100%" height="130" style={{ border:"none", display:"block" }}
//                         src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng-0.005},${coords.lat-0.004},${coords.lng+0.005},${coords.lat+0.004}&layer=mapnik&marker=${coords.lat},${coords.lng}`}/>
//                     </div>
//                   )}
//                 </div>
//                 <div><label style={S.label}>Office / Campus</label>
//                   <select style={{ ...S.input, cursor:"pointer" }} value={form.office} onChange={set("office")}>
//                     <option>Main Campus</option><option>Tech Park</option><option>North Office</option><option>South Office</option>
//                   </select>
//                 </div>
//                 <button style={{ ...S.btn, opacity:loading?0.7:1 }} onClick={handleProfile} disabled={loading || !form.name || !form.address}>
//                   {loading ? <><div style={{ width:16,height:16,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"white",borderRadius:"50%",animation:"ep-spin .7s linear infinite" }}/> Submitting…</> : "Submit Onboarding Request ✓"}
//                 </button>
//                 <p style={{ fontSize:12, color:"#94A3B8", textAlign:"center", margin:0 }}>Your request will be reviewed by the admin team</p>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//       <style>{`@keyframes ep-spin{to{transform:rotate(360deg)}}`}</style>
//     </div>
//   );
// }

// /* ─── Pickup Map (static pin) ─── */
// function PickupMap({ lat, lng, address }) {
//   const mapId = "emp-pickup-map";
//   useEffect(() => {
//     const initMap = () => {
//       const L = window.L; const el = document.getElementById(mapId);
//       if (!L || !el) return;
//       if (el._leaflet_id) { el._leaflet_id = null; el.innerHTML = ""; }
//       const map = L.map(mapId, { zoomControl:true, scrollWheelZoom:false }).setView([lat, lng], 16);
//       L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom:19 }).addTo(map);
//       const icon = L.divIcon({ className:"", html:`<div style="width:32px;height:32px;background:linear-gradient(135deg,#5b5bd6,#7c3aed);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(91,91,214,.5)"><div style="width:8px;height:8px;background:white;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"></div></div>`, iconSize:[32,32], iconAnchor:[16,32] });
//       L.marker([lat, lng], { icon }).addTo(map).bindPopup(`<b style="font-family:system-ui;font-size:12px">📍 Your Pickup</b><br><span style="font-size:11px;color:#64748b">${address || `${lat}, ${lng}`}</span>`).openPopup();
//     };
//     if (!document.getElementById("leaflet-css")) { const l=document.createElement("link"); l.id="leaflet-css"; l.rel="stylesheet"; l.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(l); }
//     if (window.L) initMap();
//     else if (!document.getElementById("leaflet-js")) { const s=document.createElement("script"); s.id="leaflet-js"; s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.onload=initMap; document.head.appendChild(s); }
//     else { const c=setInterval(()=>{ if (window.L){clearInterval(c);initMap();}},100); }
//   }, [lat, lng]);
//   return (
//     <div style={{ borderRadius:14, overflow:"hidden", border:"1.5px solid #C7D2FE" }}>
//       <div id={mapId} style={{ height:200, width:"100%" }}/>
//       <div style={{ background:"#F8FAFF", padding:"8px 12px", display:"flex", alignItems:"center", gap:6, borderTop:"1px solid #E0E7FF" }}>
//         <div style={{ width:8,height:8,borderRadius:"50%",background:"#5b5bd6",flexShrink:0 }}/>
//         <span style={{ fontSize:11,color:"#64748B",fontWeight:600,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{address || "Your pickup point"}</span>
//         <span style={{ fontSize:10,color:"#94A3B8",fontWeight:700,fontFamily:"monospace",flexShrink:0 }}>{lat?.toFixed(4)}, {lng?.toFixed(4)}</span>
//       </div>
//     </div>
//   );
// }

// /* ─── Live Tracking Map ─── */
// function LiveTrackingMap({ driverId, tripId }) {
//   const mapId    = `live-map-${tripId}`;
//   const markerRef = useRef(null);
//   const mapRef    = useRef(null);

//   useEffect(() => {
//     const init = () => {
//       const L = window.L; const el = document.getElementById(mapId);
//       if (!L || !el) return;
//       if (el._leaflet_id) { el._leaflet_id = null; el.innerHTML = ""; }
//       const map = L.map(mapId, { zoomControl:true, scrollWheelZoom:false }).setView([20.5937, 78.9629], 13);
//       L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom:19 }).addTo(map);
//       mapRef.current = map;
//       const icon = L.divIcon({ className:"", html:`<div style="width:42px;height:42px;background:linear-gradient(135deg,#10b981,#059669);border-radius:50%;border:3px solid white;box-shadow:0 4px 16px rgba(16,185,129,.5);display:flex;align-items:center;justify-content:center;font-size:20px">🚐</div>`, iconSize:[42,42], iconAnchor:[21,21] });
//       markerRef.current = L.marker([20.5937, 78.9629], { icon }).addTo(map);
//       markerRef.current.bindPopup("🚐 Your driver");
//     };
//     if (!document.getElementById("leaflet-css")) { const l=document.createElement("link"); l.id="leaflet-css"; l.rel="stylesheet"; l.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(l); }
//     if (window.L) init();
//     else if (!document.getElementById("leaflet-js")) { const s=document.createElement("script"); s.id="leaflet-js"; s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.onload=init; document.head.appendChild(s); }
//     else { const c=setInterval(()=>{ if(window.L){clearInterval(c);init();}},100); }

//     // Subscribe to real-time tracking events for this driver
//     const chan = supabase.channel(`emp-track-${driverId}-${tripId}`)
//       .on("postgres_changes", { event:"INSERT", schema:"public", table:"tracking_events", filter:`driver_id=eq.${driverId}` },
//         ({ new: ev }) => {
//           if (markerRef.current && mapRef.current) {
//             markerRef.current.setLatLng([ev.lat, ev.lng]);
//             mapRef.current.setView([ev.lat, ev.lng], Math.max(mapRef.current.getZoom(), 15));
//           }
//         })
//       .subscribe();
//     return () => { supabase.removeChannel(chan); };
//   }, [driverId, tripId]);

//   return (
//     <div style={{ borderRadius:14, overflow:"hidden", border:"1.5px solid #BBF7D0" }}>
//       <div id={mapId} style={{ height:240, width:"100%" }}/>
//       <div style={{ background:"#F0FDF4", padding:"8px 12px", display:"flex", alignItems:"center", gap:8, borderTop:"1px solid #BBF7D0" }}>
//         <span style={{ width:8,height:8,borderRadius:"50%",background:"#10b981",display:"inline-block",animation:"ep-live 1.5s ease-in-out infinite" }}/>
//         <span style={{ fontSize:11,color:"#166534",fontWeight:700 }}>Live — updates automatically as driver moves</span>
//       </div>
//     </div>
//   );
// }

// /* ─── Trip Card for employee ─── */
// function TripCard({ trip, pickupStatus, type }) {
//   const isPickup    = type === "pickup";
//   const isInProgress = trip.status === "in_progress";
//   const color = isPickup ? { main:"#5b5bd6", bg:"rgba(91,91,214,.08)", border:"rgba(91,91,214,.2)" }
//                          : { main:"#10b981", bg:"rgba(16,185,129,.08)", border:"rgba(16,185,129,.2)" };

//   const statusLabel = isInProgress ? (isPickup ? "Driver is on the way" : "Drop in progress")
//                     : trip.status === "completed" ? (isPickup ? "Picked up ✓" : "Dropped ✓")
//                     : `Scheduled · ${trip.shift_label || "—"}`;

//   return (
//     <div style={{ background:color.bg, border:`1.5px solid ${color.border}`, borderRadius:14, padding:"14px 16px", marginBottom:12 }}>
//       <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
//         <div style={{ width:36,height:36,borderRadius:10,background:color.bg,border:`1.5px solid ${color.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
//           <span style={{ fontSize:20 }}>{isPickup ? "🚐" : "🏠"}</span>
//         </div>
//         <div style={{ flex:1 }}>
//           <p style={{ fontWeight:800, color:color.main, fontSize:13, margin:"0 0 2px" }}>{isPickup ? "Pickup Trip" : "Drop Trip"}</p>
//           <p style={{ fontSize:12, color:"#64748b", margin:0 }}>{statusLabel}</p>
//         </div>
//         <span style={{ fontSize:10, fontWeight:800, padding:"3px 8px", borderRadius:99, background:color.bg, color:color.main, border:`1px solid ${color.border}` }}>
//           {pickupStatus === "picked" ? "✓ Picked" : pickupStatus === "dropped" ? "✓ Dropped" : isInProgress ? "Awaiting" : trip.status}
//         </span>
//       </div>
//       <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
//         {[
//           { label:"Route",   val:trip.routes?.name || "—" },
//           { label:"Driver",  val:trip.drivers?.name || "—" },
//           { label:"Vehicle", val:trip.cars?.number  || "—" },
//           { label:"Shift",   val:trip.shift_label   || "—" },
//         ].map(({ label, val }) => (
//           <div key={label} style={{ background:"rgba(255,255,255,.7)", borderRadius:8, padding:"7px 10px" }}>
//             <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#94A3B8", margin:0 }}>{label}</p>
//             <p style={{ fontSize:12, fontWeight:700, color:"#0F172A", margin:"2px 0 0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{val}</p>
//           </div>
//         ))}
//       </div>
//       {trip.drivers?.phone && (
//         <a href={`tel:${trip.drivers.phone}`} style={{ marginTop:10, display:"flex", alignItems:"center", gap:8, background:"white", border:`1.5px solid ${color.border}`, borderRadius:10, padding:"9px 14px", color:color.main, fontWeight:700, fontSize:13, textDecoration:"none" }}>
//           <Ic n="phone" c="w-4 h-4"/> {trip.drivers.phone}
//         </a>
//       )}
//     </div>
//   );
// }

// /* ─── EMPLOYEE DASHBOARD ─── */
// function EmployeeDashboard({ employee, onLogout }) {
//   const [tab,       setTab]       = useState("home");
//   const [pickupTrip, setPickupTrip] = useState(null); // { trip, myStatus }
//   const [dropTrip,   setDropTrip]   = useState(null);
//   const grad = avtGrad(employee.name);

//   useEffect(() => {
//     const loadTrips = async () => {
//       // Fetch all active or today-completed trip_employees for this employee
//       const { data } = await supabase
//         .from("trip_employees")
//         .select(`
//           pickup_status,
//           trips!inner(
//             id, status, shift_label, scheduled_at, started_at, driver_id, car_id, trip_type,
//             routes(name),
//             cars(number, type)
//           )
//         `)
//         .eq("employee_id", employee.id)
//         .in("trips.status", ["scheduled", "in_progress", "completed"]);

//       if (!data) return;

//       // Separate pickup / drop trips
//       for (const row of data) {
//         const trip = row.trips;
//         if (!trip) continue;

//         // Fetch driver separately
//         let driver = null;
//         if (trip.driver_id) {
//           const { data: d } = await supabase.from("drivers").select("id, name, phone, rating").eq("id", trip.driver_id).single();
//           driver = d;
//         }
//         const enriched = { ...trip, drivers: driver, my_status: row.pickup_status };

//         if (trip.trip_type === "pickup") {
//           // Keep most recent active, or if none then latest completed
//           if (!pickupTrip || trip.status === "in_progress" || (trip.status === "scheduled" && pickupTrip.status === "completed")) {
//             setPickupTrip(enriched);
//           }
//         } else if (trip.trip_type === "drop") {
//           if (!dropTrip || trip.status === "in_progress" || (trip.status === "scheduled" && dropTrip.status === "completed")) {
//             setDropTrip(enriched);
//           }
//         }
//       }
//     };
//     loadTrips();
//   }, [employee.id]);

//   const tabs = [
//     { id:"home",     icon:"grid",   label:"Home" },
//     { id:"trips",    icon:"truck",  label:"My Trips" },
//     { id:"tracking", icon:"locate", label:"Live Track" },
//     { id:"profile",  icon:"user",   label:"Profile" },
//   ];

//   // Active trip for live tracking (in_progress only)
//   const liveTrip = [pickupTrip, dropTrip].find(t => t?.status === "in_progress");

//   return (
//     <div style={{ minHeight:"100dvh", background:"#F7F8FA", fontFamily:"'DM Sans',system-ui,sans-serif", maxWidth:430, margin:"0 auto", display:"flex", flexDirection:"column" }}>

//       {/* Top bar */}
//       <div style={{ background:"white", padding:"13px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #E4E8EF", flexShrink:0 }}>
//         <div style={{ display:"flex", alignItems:"center", gap:10 }}>
//           <div style={{ width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#5b5bd6,#0ea5e9)",display:"flex",alignItems:"center",justifyContent:"center" }}>
//             <Ic n="truck" c="w-4 h-4 text-white"/>
//           </div>
//           <div>
//             <div style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>ETRAVO</div>
//             <div style={{ fontSize:10, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.06em" }}>Employee Portal</div>
//           </div>
//         </div>
//         <div style={{ display:"flex", alignItems:"center", gap:10 }}>
//           <StatusBadge status={employee.status}/>
//           <div style={{ width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${grad})`,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800 }}>
//             {initials(employee.name)}
//           </div>
//         </div>
//       </div>

//       <div style={{ flex:1, overflow:"auto", paddingBottom:80 }}>

//         {/* ── HOME TAB ── */}
//         {tab === "home" && (
//           <div style={{ padding:"16px 14px 0" }}>
//             {/* Hero */}
//             <div style={{ background:"linear-gradient(135deg,#5b5bd6,#7c3aed)", borderRadius:18, padding:"20px 20px", marginBottom:14, position:"relative", overflow:"hidden" }}>
//               <div style={{ position:"absolute", top:-20, right:-20, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,.07)" }}/>
//               <p style={{ color:"rgba(255,255,255,.7)", fontSize:12, fontWeight:600, margin:"0 0 4px" }}>{getGreeting()},</p>
//               <h2 style={{ color:"white", fontSize:20, fontWeight:800, margin:"0 0 12px" }}>{employee.name} 👋</h2>
//               <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
//                 <span style={{ background:"rgba(255,255,255,.15)", color:"white", borderRadius:8, padding:"4px 10px", fontSize:11, fontWeight:700 }}>ID: {employee.id}</span>
//                 <span style={{ background:"rgba(255,255,255,.15)", color:"white", borderRadius:8, padding:"4px 10px", fontSize:11, fontWeight:700 }}>{employee.shift || "09:00 AM"} Shift</span>
//               </div>
//             </div>

//             {/* Status alerts */}
//             {employee.status === "pending" && (
//               <div style={{ background:"#FFFBEB", border:"1.5px solid #FDE68A", borderRadius:14, padding:"14px 16px", marginBottom:12 }}>
//                 <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
//                   <span style={{ fontSize:24 }}>⏳</span>
//                   <div>
//                     <p style={{ fontWeight:800, color:"#92400E", fontSize:13, margin:"0 0 3px" }}>Request Under Review</p>
//                     <p style={{ color:"#B45309", fontSize:12, margin:0 }}>Your onboarding request has been submitted. Admin will review and assign you to a route shortly.</p>
//                   </div>
//                 </div>
//               </div>
//             )}
//             {employee.status === "rejected" && (
//               <div style={{ background:"#FFF1F2", border:"1.5px solid #FECDD3", borderRadius:14, padding:"14px 16px", marginBottom:12 }}>
//                 <div style={{ display:"flex", gap:10 }}>
//                   <span style={{ fontSize:20 }}>❌</span>
//                   <div><p style={{ fontWeight:800, color:"#9F1239", fontSize:13, margin:"0 0 3px" }}>Request Rejected</p><p style={{ color:"#BE123C", fontSize:12, margin:0 }}>Contact admin for details.</p></div>
//                 </div>
//               </div>
//             )}

//             {/* Trip summary cards */}
//             {employee.status === "approved" && (
//               <>
//                 {/* Pickup trip quick view */}
//                 <div style={S.card}>
//                   <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
//                     <span style={{ fontSize:20 }}>🚐</span>
//                     <p style={{ fontWeight:800, color:"#0F172A", fontSize:14, margin:0 }}>Today's Pickup</p>
//                     {pickupTrip && <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:99, background:pickupTrip.status==="in_progress"?"rgba(16,185,129,.1)":"rgba(91,91,214,.08)", color:pickupTrip.status==="in_progress"?"#059669":"#5b5bd6", border:`1px solid ${pickupTrip.status==="in_progress"?"rgba(16,185,129,.25)":"rgba(91,91,214,.2)"}` }}>{pickupTrip.status==="in_progress"?"🟢 On the way":pickupTrip.status==="completed"?"✅ Done":"🟡 Scheduled"}</span>}
//                   </div>
//                   {pickupTrip ? (
//                     <div style={{ background:"#F8FAFF", borderRadius:10, padding:"10px 12px" }}>
//                       <p style={{ fontSize:13, fontWeight:700, color:"#0F172A", margin:"0 0 3px" }}>{pickupTrip.routes?.name || "—"}</p>
//                       <p style={{ fontSize:12, color:"#64748B", margin:0 }}>Driver: {pickupTrip.drivers?.name || "—"} · {pickupTrip.cars?.number || "—"}</p>
//                     </div>
//                   ) : <p style={{ fontSize:13, color:"#94A3B8", margin:0 }}>No pickup trip assigned yet</p>}
//                 </div>

//                 {/* Drop trip quick view */}
//                 <div style={S.card}>
//                   <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
//                     <span style={{ fontSize:20 }}>🏠</span>
//                     <p style={{ fontWeight:800, color:"#0F172A", fontSize:14, margin:0 }}>Today's Drop</p>
//                     {dropTrip && <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:99, background:dropTrip.status==="in_progress"?"rgba(16,185,129,.1)":"rgba(16,185,129,.08)", color:dropTrip.status==="in_progress"?"#059669":"#10b981", border:`1px solid ${dropTrip.status==="in_progress"?"rgba(16,185,129,.25)":"rgba(16,185,129,.2)"}` }}>{dropTrip.status==="in_progress"?"🟢 Dropping now":dropTrip.status==="completed"?"✅ Done":"🟡 Scheduled"}</span>}
//                   </div>
//                   {dropTrip ? (
//                     <div style={{ background:"#F0FDF4", borderRadius:10, padding:"10px 12px" }}>
//                       <p style={{ fontSize:13, fontWeight:700, color:"#0F172A", margin:"0 0 3px" }}>{dropTrip.routes?.name || "—"}</p>
//                       <p style={{ fontSize:12, color:"#64748B", margin:0 }}>Driver: {dropTrip.drivers?.name || "—"} · {dropTrip.cars?.number || "—"}</p>
//                     </div>
//                   ) : <p style={{ fontSize:13, color:"#94A3B8", margin:0 }}>No drop trip assigned yet</p>}
//                 </div>
//               </>
//             )}

//             {/* Pickup location */}
//             <div style={S.card}>
//               <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
//                 <div style={{ width:34,height:34,borderRadius:10,background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}><Ic n="pin" c="w-4 h-4 text-blue-600"/></div>
//                 <div>
//                   <p style={{ fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:"#94A3B8",margin:0 }}>Your Pickup Location</p>
//                   <p style={{ fontSize:13,fontWeight:700,color:"#334155",margin:0,marginTop:2 }}>{employee.address || "Not set"}</p>
//                 </div>
//               </div>
//               {employee.lat && employee.lng
//                 ? <PickupMap lat={employee.lat} lng={employee.lng} address={employee.address}/>
//                 : <div style={{ background:"#F8FAFC",borderRadius:12,height:120,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:"1.5px dashed #E2E8F0",gap:6 }}>
//                     <span style={{ fontSize:28 }}>📍</span>
//                     <p style={{ fontSize:12,color:"#94A3B8",fontWeight:600,margin:0 }}>No coordinates — fetch GPS during onboarding</p>
//                   </div>}
//             </div>
//           </div>
//         )}

//         {/* ── MY TRIPS TAB ── */}
//         {tab === "trips" && (
//           <div style={{ padding:"16px 14px 0" }}>
//             <div style={{ marginBottom:16 }}>
//               <h2 style={{ fontSize:18, fontWeight:800, color:"#0F172A", margin:"0 0 4px" }}>My Trips</h2>
//               <p style={{ fontSize:13, color:"#94A3B8", margin:0 }}>Your assigned pickup and drop trips</p>
//             </div>

//             {!pickupTrip && !dropTrip ? (
//               <div style={{ textAlign:"center", padding:"40px 20px", background:"white", borderRadius:16, boxShadow:"0 2px 12px rgba(0,0,0,.06)" }}>
//                 <div style={{ fontSize:48, marginBottom:12 }}>🚌</div>
//                 <p style={{ fontWeight:700, color:"#0F172A", fontSize:16 }}>No Trips Assigned Yet</p>
//                 <p style={{ color:"#94A3B8", fontSize:13 }}>Once admin creates a trip and adds you, it will appear here.</p>
//               </div>
//             ) : (
//               <>
//                 {/* Pickup trip */}
//                 <p style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:"#94A3B8", margin:"0 0 8px" }}>Pickup Trip</p>
//                 {pickupTrip
//                   ? <TripCard trip={pickupTrip} pickupStatus={pickupTrip.my_status} type="pickup"/>
//                   : <div style={{ background:"#F8FAFC", borderRadius:14, padding:"14px 16px", marginBottom:12, textAlign:"center", color:"#94A3B8", fontSize:13 }}>No pickup trip assigned</div>}

//                 {/* Drop trip */}
//                 <p style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:"#94A3B8", margin:"4px 0 8px" }}>Drop Trip</p>
//                 {dropTrip
//                   ? <TripCard trip={dropTrip} pickupStatus={dropTrip.my_status} type="drop"/>
//                   : <div style={{ background:"#F8FAFC", borderRadius:14, padding:"14px 16px", marginBottom:12, textAlign:"center", color:"#94A3B8", fontSize:13 }}>No drop trip assigned</div>}
//               </>
//             )}
//           </div>
//         )}

//         {/* ── LIVE TRACKING TAB ── */}
//         {tab === "tracking" && (
//           <div style={{ padding:"16px 14px 0" }}>
//             <div style={{ marginBottom:14 }}>
//               <h2 style={{ fontSize:18, fontWeight:800, color:"#0F172A", margin:"0 0 4px" }}>Live Tracking</h2>
//               <p style={{ fontSize:13, color:"#94A3B8", margin:0 }}>Real-time location of your driver</p>
//             </div>

//             {!liveTrip ? (
//               <div style={{ textAlign:"center", padding:"40px 20px", background:"white", borderRadius:16, boxShadow:"0 2px 12px rgba(0,0,0,.06)" }}>
//                 <div style={{ fontSize:48, marginBottom:12 }}>📍</div>
//                 <p style={{ fontWeight:700, color:"#0F172A", fontSize:16 }}>No Active Trip</p>
//                 <p style={{ color:"#94A3B8", fontSize:13 }}>Live tracking becomes available once a driver starts your trip.</p>
//                 {(pickupTrip || dropTrip) && (
//                   <p style={{ color:"#94A3B8", fontSize:12, marginTop:8 }}>
//                     Your {pickupTrip?.status === "scheduled" ? "pickup" : "drop"} trip is scheduled — check back when it starts.
//                   </p>
//                 )}
//               </div>
//             ) : (
//               <>
//                 {/* Driver info strip */}
//                 <div style={{ display:"flex", alignItems:"center", gap:12, background:"white", borderRadius:14, padding:"12px 14px", marginBottom:12, boxShadow:"0 2px 8px rgba(0,0,0,.04)" }}>
//                   <div style={{ width:40,height:40,borderRadius:12,background:`linear-gradient(135deg,${avtGrad(liveTrip.drivers?.name||"?")})`,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:14,flexShrink:0 }}>
//                     {initials(liveTrip.drivers?.name || "?")}
//                   </div>
//                   <div style={{ flex:1 }}>
//                     <p style={{ fontSize:14, fontWeight:800, color:"#0F172A", margin:"0 0 2px" }}>{liveTrip.drivers?.name || "—"}</p>
//                     <p style={{ fontSize:12, color:"#94A3B8", margin:0 }}>{liveTrip.cars?.number || "—"} · {liveTrip.trip_type === "pickup" ? "🚐 Pickup" : "🏠 Drop"}</p>
//                   </div>
//                   <span style={{ display:"flex",alignItems:"center",gap:5,background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.2)",color:"#059669",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700 }}>
//                     <span style={{ width:6,height:6,borderRadius:"50%",background:"#10b981",display:"inline-block",animation:"ep-live 1.5s ease-in-out infinite" }}/>LIVE
//                   </span>
//                 </div>
//                 {liveTrip.drivers?.phone && (
//                   <a href={`tel:${liveTrip.drivers.phone}`} style={{ display:"flex", alignItems:"center", gap:8, background:"#F0FDF4", border:"1.5px solid #BBF7D0", borderRadius:10, padding:"10px 14px", color:"#166534", fontWeight:700, fontSize:13, textDecoration:"none", marginBottom:12 }}>
//                     <Ic n="phone" c="w-4 h-4"/> Call Driver: {liveTrip.drivers.phone}
//                   </a>
//                 )}
//                 <LiveTrackingMap driverId={liveTrip.driver_id} tripId={liveTrip.id}/>
//               </>
//             )}
//           </div>
//         )}

//         {/* ── PROFILE TAB ── */}
//         {tab === "profile" && (
//           <div style={{ padding:"16px 14px 0" }}>
//             <div style={{ textAlign:"center", marginBottom:20 }}>
//               <div style={{ width:72,height:72,borderRadius:"50%",background:`linear-gradient(135deg,${grad})`,display:"inline-flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:900,fontSize:24,boxShadow:"0 8px 24px rgba(91,91,214,.35)",marginBottom:10 }}>
//                 {initials(employee.name)}
//               </div>
//               <h2 style={{ fontSize:18, fontWeight:800, color:"#0F172A", margin:"0 0 4px" }}>{employee.name}</h2>
//               <p style={{ fontSize:12, color:"#94A3B8", margin:"0 0 8px" }}>{employee.email}</p>
//               <StatusBadge status={employee.status}/>
//             </div>
//             <div style={S.card}>
//               {[
//                 { label:"Employee ID", value:employee.id },
//                 { label:"Phone",       value:employee.phone },
//                 { label:"Department",  value:employee.department },
//                 { label:"Office",      value:employee.office },
//                 { label:"Shift",       value:employee.shift || "09:00 AM" },
//                 { label:"Address",     value:employee.address },
//               ].map(({ label, value }) => (
//                 <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #F1F5F9" }}>
//                   <span style={{ fontSize:12,color:"#94A3B8",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em" }}>{label}</span>
//                   <span style={{ fontSize:13,fontWeight:700,color:"#0F172A",textAlign:"right",maxWidth:"55%" }}>{value || "–"}</span>
//                 </div>
//               ))}
//             </div>
//             <button onClick={onLogout} style={{ width:"100%", background:"#FFF1F2", color:"#9F1239", border:"1.5px solid #FECDD3", borderRadius:12, padding:"12px 20px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
//               <Ic n="logout" c="w-4 h-4"/> Sign Out
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Bottom nav */}
//       <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"white", borderTop:"1px solid #E4E8EF", display:"flex", padding:"8px 0 10px", zIndex:20 }}>
//         {tabs.map(t => (
//           <button key={t.id} onClick={() => setTab(t.id)}
//             style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", padding:"4px 0", color:tab===t.id?"#5b5bd6":"#94A3B8", position:"relative" }}>
//             <Ic n={t.icon} c={`w-5 h-5 ${tab===t.id?"text-indigo-600":"text-slate-400"}`}/>
//             <span style={{ fontSize:10, fontWeight:700 }}>{t.label}</span>
//             {tab===t.id && <span style={{ width:16, height:3, borderRadius:99, background:"#5b5bd6" }}/>}
//             {/* Live dot for tracking tab */}
//             {t.id==="tracking" && liveTrip && tab!=="tracking" && (
//               <span style={{ position:"absolute", top:4, right:"calc(50% - 12px)", width:7, height:7, borderRadius:"50%", background:"#10b981", animation:"ep-live 1.5s ease-in-out infinite" }}/>
//             )}
//             {/* Badge on trips tab */}
//             {t.id==="trips" && (pickupTrip || dropTrip) && tab!=="trips" && (
//               <span style={{ position:"absolute", top:3, right:"calc(50% - 14px)", width:7, height:7, borderRadius:"50%", background:"#5b5bd6" }}/>
//             )}
//           </button>
//         ))}
//       </div>
//       <style>{`@keyframes ep-live{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
//     </div>
//   );
// }

// ═══════════════════════════════════════════════════════════════
//  src/pages/EmployeePortal.jsx
//  Employee Portal — onboarding + dashboard
//  Auth flow:
//    New Employee  → Email → OTP (magic link) → Profile + GPS → Dashboard
//    Existing      → Email → OTP → Dashboard (if employee record exists)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Ic } from "../components/UI";

/* ─── helpers ─── */
function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
}
function initials(n = "?") { return n.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase(); }
const AVT = ["#6366f1,#8b5cf6","#0ea5e9,#06b6d4","#10b981,#059669","#f59e0b,#f97316","#ec4899,#e11d48"];
function avtGrad(n) { return AVT[(n || "?").charCodeAt(0) % AVT.length]; }

/* ─── shared styles ─── */
const S = {
  input: { width:"100%", background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:12, padding:"10px 14px", fontSize:14, color:"#0F172A", outline:"none", fontFamily:"inherit", boxSizing:"border-box" },
  label: { display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#94A3B8", marginBottom:5 },
  btn:   { width:"100%", background:"linear-gradient(135deg,#5b5bd6,#7c3aed)", color:"white", border:"none", borderRadius:12, padding:"12px 20px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8 },
  card:  { background:"white", borderRadius:16, padding:20, boxShadow:"0 2px 12px rgba(0,0,0,.06)", marginBottom:12 },
};

/* ─── Spinner ─── */
function Spinner() {
  return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F7F8FA", fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:42, height:42, border:"3px solid #5b5bd6", borderTopColor:"transparent", borderRadius:"50%", animation:"ep-spin 0.8s linear infinite", margin:"0 auto 14px" }}/>
        <div style={{ color:"#94A3B8", fontSize:14, fontWeight:600 }}>Loading…</div>
        <style>{`@keyframes ep-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

/* ─── Status Badge ─── */
function StatusBadge({ status }) {
  const MAP = {
    pending:  { bg:"#fffbeb", color:"#92400e", border:"#fde68a", dot:"#f59e0b", label:"Pending Approval" },
    approved: { bg:"#f0fdf4", color:"#166534", border:"#bbf7d0", dot:"#22c55e", label:"Approved" },
    rejected: { bg:"#fff1f2", color:"#9f1239", border:"#fecdd3", dot:"#f43f5e", label:"Rejected" },
  };
  const s = MAP[status] || MAP.pending;
  return (
    <span style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}`, display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:99, fontSize:12, fontWeight:700 }}>
      <span style={{ width:7, height:7, borderRadius:"50%", background:s.dot, display:"inline-block" }}/>{s.label}
    </span>
  );
}

/* ─── Auth page wrapper — defined OUTSIDE OnboardingForm so it never remounts ─── */
function AuthWrap({ title, sub, error, children }) {
  return (
    <div style={{ minHeight:"100dvh", background:"linear-gradient(135deg,#0d0f14 0%,#141828 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", background:"radial-gradient(ellipse 70% 50% at 30% 20%, rgba(91,91,214,.2) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 75% 80%, rgba(14,165,233,.15) 0%, transparent 60%)" }}/>
      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:32 }}>
          <svg width="38" height="38" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="12" fill="url(#ep-grad)"/>
            <defs>
              <linearGradient id="ep-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#5b5bd6"/><stop offset="1" stopColor="#0ea5e9"/>
              </linearGradient>
            </defs>
            <path d="M10 28 Q14 20 20 20 Q26 20 30 12" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.5"/>
            <circle cx="30" cy="11" r="4.5" fill="white" opacity="0.95"/>
            <circle cx="30" cy="11" r="2" fill="#5b5bd6"/>
            <path d="M17 22.5 L20 19.5 L23 22.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="10" cy="28" r="2.5" fill="white" opacity="0.8"/>
          </svg>
          <span style={{ fontWeight:900, color:"white", fontSize:22, letterSpacing:"-0.02em" }}>ETRAVO</span>
        </div>
        <div style={{ background:"white", borderRadius:20, padding:28, boxShadow:"0 24px 80px rgba(0,0,0,.3)" }}>
          <div style={{ marginBottom:22 }}>
            <h1 style={{ fontSize:20, fontWeight:800, color:"#0F172A", margin:"0 0 6px" }}>{title}</h1>
            <p style={{ fontSize:13, color:"#94A3B8", margin:0 }}>{sub}</p>
          </div>
          {error && (
            <div style={{ background:"#FFF1F2", border:"1px solid #FECDD3", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#9F1239", fontWeight:600 }}>
              {error}
            </div>
          )}
          {children}
        </div>
      </div>
      <style>{`@keyframes ep-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ONBOARDING FORM — New auth flow
   Steps:
     1  → Enter email (tab: new / existing)
     2  → OTP verification (magic link code)
     3  → Profile form  (new employees only — skipped for existing)
   ═══════════════════════════════════════════════════════════════ */
function OnboardingForm({ onSuccess }) {
  const [mode,      setMode]      = useState("new");       // "new" | "existing"
  const [step,      setStep]      = useState(1);           // 1=email, 2=otp, 3=profile
  const [email,     setEmail]     = useState("");
  const [otp,       setOtp]       = useState(["","","","","","","",""]);
  const [form,      setForm]      = useState({ name:"", phone:"", department:"", shift:"09:00 AM", address:"", office:"Main Campus" });
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [resendCD,  setResendCD]  = useState(0);           // countdown seconds
  const [coords,    setCoords]    = useState(null);
  const [geoStatus, setGeoStatus] = useState("idle");
  const otpRefs = useRef([]);
  const resendTimer = useRef(null);

  /* ── countdown for resend ── */
  const startCountdown = (secs = 60) => {
    setResendCD(secs);
    clearInterval(resendTimer.current);
    resendTimer.current = setInterval(() => {
      setResendCD(prev => { if (prev <= 1) { clearInterval(resendTimer.current); return 0; } return prev - 1; });
    }, 1000);
  };
  useEffect(() => () => clearInterval(resendTimer.current), []);

  /* ── OTP input helpers ── */
  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 7) otpRefs.current[i + 1]?.focus();
  };
  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };
  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
    if (pasted.length === 8) {
      setOtp(pasted.split(""));
      otpRefs.current[7]?.focus();
      e.preventDefault();
    }
  };
  const otpValue = otp.join("");

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  /* ── Step 1: send magic link OTP ── */
  const handleSendOtp = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address."); return;
    }
    setError(""); setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: undefined, // force OTP token email, not magic link
        },
      });
      if (err) throw err;
      setStep(2);
      startCountdown(60);
    } catch (err) {
      setError(err?.message || "Failed to send OTP. Please try again.");
    }
    setLoading(false);
  };

  /* ── Step 2: verify OTP ── */
  const handleVerifyOtp = async () => {
    if (otpValue.length !== 8) { setError("Enter the 8-digit code."); return; }
    setError(""); setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.verifyOtp({
        email,
        token: otpValue,
        type: "email",
      });
      if (err) throw err;

      const userId = data.user?.id;
      if (!userId) throw new Error("Authentication failed — no user returned.");

      // Check if employee record already exists
      const { data: empData } = await supabase
        .from("employees").select("*").eq("user_id", userId).single();

      if (empData) {
        // Existing employee — go straight to dashboard
        onSuccess(empData);
        return;
      }

      // New employee — go to profile step
      setStep(3);
    } catch (err) {
      setError(err?.message || "Invalid or expired code. Please try again.");
    }
    setLoading(false);
  };

  /* ── Step 2: resend OTP ── */
  const handleResend = async () => {
    if (resendCD > 0) return;
    setError(""); setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: undefined, // force OTP token email, not magic link
        },
      });
      if (err) throw err;
      setOtp(["","","","","","","",""]);
      otpRefs.current[0]?.focus();
      startCountdown(60);
    } catch (err) {
      setError(err?.message || "Failed to resend. Please try again.");
    }
    setLoading(false);
  };

  /* ── GPS fetch ── */
  const fetchGeo = () => {
    if (!navigator.geolocation) { setGeoStatus("error"); return; }
    setGeoStatus("fetching");
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ lat: parseFloat(pos.coords.latitude.toFixed(6)), lng: parseFloat(pos.coords.longitude.toFixed(6)) }); setGeoStatus("done"); },
      () => setGeoStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /* ── Step 3: save profile + create employee ── */
  const handleProfile = async () => {
    if (!form.name.trim() || !form.address.trim()) { setError("Name and address are required."); return; }
    setError(""); setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expired. Please sign in again.");

      const empId = "EMP" + Math.random().toString(36).slice(2, 6).toUpperCase();
      const { data: inserted, error: insErr } = await supabase.from("employees").insert({
        id: empId,
        user_id: user.id,
        name: form.name,
        email: user.email,
        phone: form.phone,
        department: form.department,
        shift: form.shift,
        address: form.address,
        office: form.office,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        status: "pending",
        route_id: null,
      }).select().single();
      if (insErr) throw insErr;

      // Auto-create boarding request
      await supabase.from("boarding_requests").insert({
        employee_id: empId,
        shift: form.shift,
        status: "pending",
      });

      onSuccess(inserted);
    } catch (err) {
      const msg = err?.message || "Unknown error";
      const details = err?.details ? `: ${err.details}` : "";
      setError(msg + details);
    }
    setLoading(false);
  };

  /* ══ STEP 1: Email entry ══ */
  if (step === 1) return (
    <AuthWrap title="Welcome to ETRAVO" sub="Enter your work email to get started" error={error}>
      <style>{`.auth-input:focus { border-color:#5b5bd6 !important; box-shadow:0 0 0 3px rgba(91,91,214,.15); outline:none; }`}</style>
      {/* Tab toggle */}
      <div style={{ display:"flex", marginBottom:20, background:"#F1F5F9", borderRadius:10, padding:3 }}>
        {[["new","New Employee"],["existing","Existing Employee"]].map(([m, label]) => (
          <button key={m} onClick={() => { setMode(m); setError(""); }}
            style={{ flex:1, padding:"7px 0", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit", background:mode===m?"white":"transparent", color:mode===m?"#5b5bd6":"#94A3B8", boxShadow:mode===m?"0 1px 6px rgba(0,0,0,.08)":"none" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div>
          <label style={S.label}>Work Email</label>
          <input
            className="auth-input"
            style={S.input}
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            placeholder="you@company.com"
            onKeyDown={e => e.key === "Enter" && handleSendOtp()}
            autoComplete="email"
          />
        </div>

        <button
          style={{ ...S.btn, opacity:(loading || !email) ? 0.7 : 1 }}
          onClick={handleSendOtp}
          disabled={loading || !email}
        >
          {loading
            ? <><div style={{ width:16,height:16,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"white",borderRadius:"50%",animation:"ep-spin .7s linear infinite" }}/> Sending…</>
            : <>Send Verification Code →</>}
        </button>

        <p style={{ fontSize:12, color:"#94A3B8", textAlign:"center", margin:0 }}>
          We'll send an 8-digit code to your email — no password needed
        </p>
      </div>
    </AuthWrap>
  );

  /* ══ STEP 2: OTP verification ══ */
  if (step === 2) return (
    <AuthWrap title="Check Your Email" sub={`We sent an 8-digit code to ${email}`} error={error}>
      {/* Inject CSS-based focus ring so we never touch .style in event handlers */}
      <style>{`
        .otp-input { box-sizing:border-box; }
        .otp-input:focus { border-color:#5b5bd6 !important; box-shadow:0 0 0 3px rgba(91,91,214,.15); }
      `}</style>
      {/* OTP boxes */}
      <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:20 }} onPaste={handleOtpPaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => otpRefs.current[i] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleOtpChange(i, e.target.value)}
            onKeyDown={e => handleOtpKeyDown(i, e)}
            className="otp-input"
            style={{
              width:38, height:50, textAlign:"center", fontSize:20, fontWeight:800,
              background:"#F8FAFC", border:`2px solid ${digit ? "#5b5bd6" : "#E2E8F0"}`,
              borderRadius:12, color:"#0F172A", outline:"none", fontFamily:"inherit",
              transition:"border-color .15s",
            }}
            autoFocus={i === 0}
          />
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <button
          style={{ ...S.btn, opacity:(loading || otpValue.length < 8) ? 0.7 : 1 }}
          onClick={handleVerifyOtp}
          disabled={loading || otpValue.length < 8}
        >
          {loading
            ? <><div style={{ width:16,height:16,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"white",borderRadius:"50%",animation:"ep-spin .7s linear infinite" }}/> Verifying…</>
            : "Verify & Continue →"}
        </button>

        {/* Resend + back */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <button
            onClick={() => { setStep(1); setOtp(["","","","","","","",""]); setError(""); }}
            style={{ background:"none", border:"none", fontSize:12, fontWeight:700, color:"#94A3B8", cursor:"pointer", fontFamily:"inherit", padding:0 }}
          >
            ← Change email
          </button>
          <button
            onClick={handleResend}
            disabled={resendCD > 0 || loading}
            style={{ background:"none", border:"none", fontSize:12, fontWeight:700, color:resendCD>0?"#CBD5E1":"#5b5bd6", cursor:resendCD>0?"default":"pointer", fontFamily:"inherit", padding:0 }}
          >
            {resendCD > 0 ? `Resend in ${resendCD}s` : "Resend code"}
          </button>
        </div>
      </div>

      <div style={{ marginTop:16, background:"#F8FAFF", borderRadius:10, padding:"10px 14px", display:"flex", gap:8, alignItems:"flex-start" }}>
        <span style={{ fontSize:16, flexShrink:0 }}>💡</span>
        <p style={{ fontSize:12, color:"#64748B", margin:0, lineHeight:1.5 }}>
          Check your inbox (and spam folder). The code expires in 10 minutes. You can also click the magic link in the email directly.
        </p>
      </div>
    </AuthWrap>
  );

  /* ══ STEP 3: Profile form (new employees only) ══ */
  return (
    <AuthWrap title="Complete Your Profile" sub="Tell us about yourself so we can assign the right route" error={error}>
      <style>{`
        .auth-input:focus { border-color:#5b5bd6 !important; box-shadow:0 0 0 3px rgba(91,91,214,.15); }
      `}</style>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {/* Email chip (read-only reminder) */}
        <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:8, padding:"7px 12px", display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ fontSize:14 }}>✅</span>
          <span style={{ fontSize:12, fontWeight:700, color:"#166534" }}>Verified: {email}</span>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label style={S.label}>Full Name *</label>
            <input className="auth-input" style={S.input} value={form.name} onChange={set("name")} placeholder="Raj Kumar"/>
          </div>
          <div>
            <label style={S.label}>Phone</label>
            <input className="auth-input" style={S.input} value={form.phone} onChange={set("phone")} placeholder="+91 98765…"/>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label style={S.label}>Department</label>
            <input className="auth-input" style={S.input} value={form.department} onChange={set("department")} placeholder="Engineering"/>
          </div>
          <div>
            <label style={S.label}>Shift</label>
            <select className="auth-input" style={{ ...S.input, cursor:"pointer" }} value={form.shift} onChange={set("shift")}>
              <option>08:30 AM</option><option>09:00 AM</option><option>10:00 AM</option><option>02:00 PM</option>
            </select>
          </div>
        </div>

        {/* Address + GPS */}
        <div>
          <label style={S.label}>Pickup Address *</label>
          <input className="auth-input" style={S.input} value={form.address} onChange={set("address")} placeholder="e.g. Sector 62, Noida"/>

          <button type="button" onClick={fetchGeo} disabled={geoStatus==="fetching"}
            style={{ marginTop:8, display:"flex", alignItems:"center", gap:7, background:geoStatus==="done"?"#F0FDF4":"#F8FAFF", border:`1.5px solid ${geoStatus==="done"?"#BBF7D0":geoStatus==="error"?"#FECDD3":"#C7D2FE"}`, borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:700, color:geoStatus==="done"?"#166534":geoStatus==="error"?"#9F1239":"#4F46E5", cursor:geoStatus==="fetching"?"not-allowed":"pointer", fontFamily:"inherit", width:"100%", justifyContent:"center" }}>
            {geoStatus==="fetching" ? <><div style={{ width:13,height:13,border:"2px solid currentColor",borderTopColor:"transparent",borderRadius:"50%",animation:"ep-spin .7s linear infinite" }}/> Fetching…</>
             : geoStatus==="done"    ? <>✓ Location captured — {coords.lat}, {coords.lng}</>
             : geoStatus==="error"   ? <>⚠ Could not get location — you can skip this</>
             : <>📍 Fetch My GPS Location (optional)</>}
          </button>

          {coords && geoStatus==="done" && (
            <div style={{ marginTop:10, borderRadius:12, overflow:"hidden", border:"1.5px solid #C7D2FE", height:130 }}>
              <iframe title="pickup-preview" width="100%" height="130" style={{ border:"none", display:"block" }}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng-0.005},${coords.lat-0.004},${coords.lng+0.005},${coords.lat+0.004}&layer=mapnik&marker=${coords.lat},${coords.lng}`}/>
            </div>
          )}
        </div>

        <div>
          <label style={S.label}>Office / Campus</label>
          <select className="auth-input" style={{ ...S.input, cursor:"pointer" }} value={form.office} onChange={set("office")}>
            <option>Main Campus</option><option>Tech Park</option><option>North Office</option><option>South Office</option>
          </select>
        </div>

        <button
          style={{ ...S.btn, opacity:(loading || !form.name || !form.address) ? 0.7 : 1 }}
          onClick={handleProfile}
          disabled={loading || !form.name || !form.address}
        >
          {loading
            ? <><div style={{ width:16,height:16,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"white",borderRadius:"50%",animation:"ep-spin .7s linear infinite" }}/> Submitting…</>
            : "Submit Onboarding Request ✓"}
        </button>

        <p style={{ fontSize:12, color:"#94A3B8", textAlign:"center", margin:0 }}>
          Your request will be reviewed by the admin team
        </p>
      </div>
    </AuthWrap>
  );
}

/* ─── Pickup Map (static pin) ─── */
function PickupMap({ lat, lng, address }) {
  const mapId = "emp-pickup-map";
  useEffect(() => {
    const initMap = () => {
      const L = window.L; const el = document.getElementById(mapId);
      if (!L || !el) return;
      if (el._leaflet_id) { el._leaflet_id = null; el.innerHTML = ""; }
      const map = L.map(mapId, { zoomControl:true, scrollWheelZoom:false }).setView([lat, lng], 16);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom:19 }).addTo(map);
      const icon = L.divIcon({ className:"", html:`<div style="width:32px;height:32px;background:linear-gradient(135deg,#5b5bd6,#7c3aed);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(91,91,214,.5)"><div style="width:8px;height:8px;background:white;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"></div></div>`, iconSize:[32,32], iconAnchor:[16,32] });
      L.marker([lat, lng], { icon }).addTo(map).bindPopup(`<b style="font-family:system-ui;font-size:12px">📍 Your Pickup</b><br><span style="font-size:11px;color:#64748b">${address || `${lat}, ${lng}`}</span>`).openPopup();
    };
    if (!document.getElementById("leaflet-css")) { const l=document.createElement("link"); l.id="leaflet-css"; l.rel="stylesheet"; l.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(l); }
    if (window.L) initMap();
    else if (!document.getElementById("leaflet-js")) { const s=document.createElement("script"); s.id="leaflet-js"; s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.onload=initMap; document.head.appendChild(s); }
    else { const c=setInterval(()=>{ if (window.L){clearInterval(c);initMap();}},100); }
  }, [lat, lng]);
  return (
    <div style={{ borderRadius:14, overflow:"hidden", border:"1.5px solid #C7D2FE" }}>
      <div id={mapId} style={{ height:200, width:"100%" }}/>
      <div style={{ background:"#F8FAFF", padding:"8px 12px", display:"flex", alignItems:"center", gap:6, borderTop:"1px solid #E0E7FF" }}>
        <div style={{ width:8,height:8,borderRadius:"50%",background:"#5b5bd6",flexShrink:0 }}/>
        <span style={{ fontSize:11,color:"#64748B",fontWeight:600,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{address || "Your pickup point"}</span>
        <span style={{ fontSize:10,color:"#94A3B8",fontWeight:700,fontFamily:"monospace",flexShrink:0 }}>{lat?.toFixed(4)}, {lng?.toFixed(4)}</span>
      </div>
    </div>
  );
}

/* ─── Live Tracking Map ─── */
function LiveTrackingMap({ driverId, tripId }) {
  const mapId    = `live-map-${tripId}`;
  const markerRef = useRef(null);
  const mapRef    = useRef(null);

  useEffect(() => {
    const init = () => {
      const L = window.L; const el = document.getElementById(mapId);
      if (!L || !el) return;
      if (el._leaflet_id) { el._leaflet_id = null; el.innerHTML = ""; }
      const map = L.map(mapId, { zoomControl:true, scrollWheelZoom:false }).setView([20.5937, 78.9629], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom:19 }).addTo(map);
      mapRef.current = map;
      const icon = L.divIcon({ className:"", html:`<div style="width:42px;height:42px;background:linear-gradient(135deg,#10b981,#059669);border-radius:50%;border:3px solid white;box-shadow:0 4px 16px rgba(16,185,129,.5);display:flex;align-items:center;justify-content:center;font-size:20px">🚐</div>`, iconSize:[42,42], iconAnchor:[21,21] });
      markerRef.current = L.marker([20.5937, 78.9629], { icon }).addTo(map);
      markerRef.current.bindPopup("🚐 Your driver");
    };
    if (!document.getElementById("leaflet-css")) { const l=document.createElement("link"); l.id="leaflet-css"; l.rel="stylesheet"; l.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(l); }
    if (window.L) init();
    else if (!document.getElementById("leaflet-js")) { const s=document.createElement("script"); s.id="leaflet-js"; s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.onload=init; document.head.appendChild(s); }
    else { const c=setInterval(()=>{ if(window.L){clearInterval(c);init();}},100); }

    const chan = supabase.channel(`emp-track-${driverId}-${tripId}`)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"tracking_events", filter:`driver_id=eq.${driverId}` },
        ({ new: ev }) => {
          if (markerRef.current && mapRef.current) {
            markerRef.current.setLatLng([ev.lat, ev.lng]);
            mapRef.current.setView([ev.lat, ev.lng], Math.max(mapRef.current.getZoom(), 15));
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(chan); };
  }, [driverId, tripId]);

  return (
    <div style={{ borderRadius:14, overflow:"hidden", border:"1.5px solid #BBF7D0" }}>
      <div id={mapId} style={{ height:240, width:"100%" }}/>
      <div style={{ background:"#F0FDF4", padding:"8px 12px", display:"flex", alignItems:"center", gap:8, borderTop:"1px solid #BBF7D0" }}>
        <span style={{ width:8,height:8,borderRadius:"50%",background:"#10b981",display:"inline-block",animation:"ep-live 1.5s ease-in-out infinite" }}/>
        <span style={{ fontSize:11,color:"#166534",fontWeight:700 }}>Live — updates automatically as driver moves</span>
      </div>
    </div>
  );
}

/* ─── Trip Card for employee ─── */
function TripCard({ trip, pickupStatus, type }) {
  const isPickup    = type === "pickup";
  const isInProgress = trip.status === "in_progress";
  const color = isPickup ? { main:"#5b5bd6", bg:"rgba(91,91,214,.08)", border:"rgba(91,91,214,.2)" }
                         : { main:"#10b981", bg:"rgba(16,185,129,.08)", border:"rgba(16,185,129,.2)" };

  const statusLabel = isInProgress ? (isPickup ? "Driver is on the way" : "Drop in progress")
                    : trip.status === "completed" ? (isPickup ? "Picked up ✓" : "Dropped ✓")
                    : `Scheduled · ${trip.shift_label || "—"}`;

  return (
    <div style={{ background:color.bg, border:`1.5px solid ${color.border}`, borderRadius:14, padding:"14px 16px", marginBottom:12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
        <div style={{ width:36,height:36,borderRadius:10,background:color.bg,border:`1.5px solid ${color.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
          <span style={{ fontSize:20 }}>{isPickup ? "🚐" : "🏠"}</span>
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontWeight:800, color:color.main, fontSize:13, margin:"0 0 2px" }}>{isPickup ? "Pickup Trip" : "Drop Trip"}</p>
          <p style={{ fontSize:12, color:"#64748b", margin:0 }}>{statusLabel}</p>
        </div>
        <span style={{ fontSize:10, fontWeight:800, padding:"3px 8px", borderRadius:99, background:color.bg, color:color.main, border:`1px solid ${color.border}` }}>
          {pickupStatus === "picked" ? "✓ Picked" : pickupStatus === "dropped" ? "✓ Dropped" : isInProgress ? "Awaiting" : trip.status}
        </span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {[
          { label:"Route",   val:trip.routes?.name || "—" },
          { label:"Driver",  val:trip.drivers?.name || "—" },
          { label:"Vehicle", val:trip.cars?.number  || "—" },
          { label:"Shift",   val:trip.shift_label   || "—" },
        ].map(({ label, val }) => (
          <div key={label} style={{ background:"rgba(255,255,255,.7)", borderRadius:8, padding:"7px 10px" }}>
            <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#94A3B8", margin:0 }}>{label}</p>
            <p style={{ fontSize:12, fontWeight:700, color:"#0F172A", margin:"2px 0 0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{val}</p>
          </div>
        ))}
      </div>
      {trip.drivers?.phone && (
        <a href={`tel:${trip.drivers.phone}`} style={{ marginTop:10, display:"flex", alignItems:"center", gap:8, background:"white", border:`1.5px solid ${color.border}`, borderRadius:10, padding:"9px 14px", color:color.main, fontWeight:700, fontSize:13, textDecoration:"none" }}>
          <Ic n="phone" c="w-4 h-4"/> {trip.drivers.phone}
        </a>
      )}
    </div>
  );
}

/* ─── EMPLOYEE DASHBOARD ─── */
function EmployeeDashboard({ employee, onLogout }) {
  const [tab,        setTab]        = useState("home");
  const [pickupTrip, setPickupTrip] = useState(null);
  const [dropTrip,   setDropTrip]   = useState(null);
  const grad = avtGrad(employee.name);

  useEffect(() => {
    const loadTrips = async () => {
      const { data } = await supabase
        .from("trip_employees")
        .select(`
          pickup_status,
          trips!inner(
            id, status, shift_label, scheduled_at, started_at, driver_id, car_id, trip_type,
            routes(name),
            cars(number, type)
          )
        `)
        .eq("employee_id", employee.id)
        .in("trips.status", ["scheduled", "in_progress", "completed"]);

      if (!data) return;

      for (const row of data) {
        const trip = row.trips;
        if (!trip) continue;
        let driver = null;
        if (trip.driver_id) {
          const { data: d } = await supabase.from("drivers").select("id, name, phone, rating").eq("id", trip.driver_id).single();
          driver = d;
        }
        const enriched = { ...trip, drivers: driver, my_status: row.pickup_status };
        if (trip.trip_type === "pickup") {
          if (!pickupTrip || trip.status === "in_progress" || (trip.status === "scheduled" && pickupTrip.status === "completed"))
            setPickupTrip(enriched);
        } else if (trip.trip_type === "drop") {
          if (!dropTrip || trip.status === "in_progress" || (trip.status === "scheduled" && dropTrip.status === "completed"))
            setDropTrip(enriched);
        }
      }
    };
    loadTrips();
  }, [employee.id]);

  const tabs = [
    { id:"home",     icon:"grid",   label:"Home" },
    { id:"trips",    icon:"truck",  label:"My Trips" },
    { id:"tracking", icon:"locate", label:"Live Track" },
    { id:"profile",  icon:"user",   label:"Profile" },
  ];

  const liveTrip = [pickupTrip, dropTrip].find(t => t?.status === "in_progress");

  return (
    <div style={{ minHeight:"100dvh", background:"#F7F8FA", fontFamily:"'DM Sans',system-ui,sans-serif", maxWidth:430, margin:"0 auto", display:"flex", flexDirection:"column" }}>

      {/* Top bar */}
      <div style={{ background:"white", padding:"13px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #E4E8EF", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <svg width="30" height="30" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="url(#tb-grad)"/>
            <defs>
              <linearGradient id="tb-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#5b5bd6"/><stop offset="1" stopColor="#0ea5e9"/>
              </linearGradient>
            </defs>
            <path d="M10 28 Q14 20 20 20 Q26 20 30 12" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.5"/>
            <circle cx="30" cy="11" r="4.5" fill="white" opacity="0.95"/>
            <circle cx="30" cy="11" r="2" fill="#5b5bd6"/>
            <path d="M17 22.5 L20 19.5 L23 22.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="10" cy="28" r="2.5" fill="white" opacity="0.8"/>
          </svg>
          <div>
            <div style={{ fontSize:14, fontWeight:900, color:"#0F172A", letterSpacing:"-0.01em" }}>ETRAVO</div>
            <div style={{ fontSize:10, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.06em" }}>Employee Portal</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <StatusBadge status={employee.status}/>
          <div style={{ width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${grad})`,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800 }}>
            {initials(employee.name)}
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflow:"auto", paddingBottom:80 }}>

        {/* ── HOME TAB ── */}
        {tab === "home" && (
          <div style={{ padding:"16px 14px 0" }}>
            <div style={{ background:"linear-gradient(135deg,#5b5bd6,#7c3aed)", borderRadius:18, padding:"20px 20px", marginBottom:14, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:-20, right:-20, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,.07)" }}/>
              <p style={{ color:"rgba(255,255,255,.7)", fontSize:12, fontWeight:600, margin:"0 0 4px" }}>{getGreeting()},</p>
              <h2 style={{ color:"white", fontSize:20, fontWeight:800, margin:"0 0 12px" }}>{employee.name} 👋</h2>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <span style={{ background:"rgba(255,255,255,.15)", color:"white", borderRadius:8, padding:"4px 10px", fontSize:11, fontWeight:700 }}>ID: {employee.id}</span>
                <span style={{ background:"rgba(255,255,255,.15)", color:"white", borderRadius:8, padding:"4px 10px", fontSize:11, fontWeight:700 }}>{employee.shift || "09:00 AM"} Shift</span>
              </div>
            </div>

            {employee.status === "pending" && (
              <div style={{ background:"#FFFBEB", border:"1.5px solid #FDE68A", borderRadius:14, padding:"14px 16px", marginBottom:12 }}>
                <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <span style={{ fontSize:24 }}>⏳</span>
                  <div>
                    <p style={{ fontWeight:800, color:"#92400E", fontSize:13, margin:"0 0 3px" }}>Request Under Review</p>
                    <p style={{ color:"#B45309", fontSize:12, margin:0 }}>Your onboarding request has been submitted. Admin will review and assign you to a route shortly.</p>
                  </div>
                </div>
              </div>
            )}
            {employee.status === "rejected" && (
              <div style={{ background:"#FFF1F2", border:"1.5px solid #FECDD3", borderRadius:14, padding:"14px 16px", marginBottom:12 }}>
                <div style={{ display:"flex", gap:10 }}>
                  <span style={{ fontSize:20 }}>❌</span>
                  <div><p style={{ fontWeight:800, color:"#9F1239", fontSize:13, margin:"0 0 3px" }}>Request Rejected</p><p style={{ color:"#BE123C", fontSize:12, margin:0 }}>Contact admin for details.</p></div>
                </div>
              </div>
            )}

            {employee.status === "approved" && (
              <>
                <div style={S.card}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                    <span style={{ fontSize:20 }}>🚐</span>
                    <p style={{ fontWeight:800, color:"#0F172A", fontSize:14, margin:0 }}>Today's Pickup</p>
                    {pickupTrip && <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:99, background:pickupTrip.status==="in_progress"?"rgba(16,185,129,.1)":"rgba(91,91,214,.08)", color:pickupTrip.status==="in_progress"?"#059669":"#5b5bd6", border:`1px solid ${pickupTrip.status==="in_progress"?"rgba(16,185,129,.25)":"rgba(91,91,214,.2)"}` }}>{pickupTrip.status==="in_progress"?"🟢 On the way":pickupTrip.status==="completed"?"✅ Done":"🟡 Scheduled"}</span>}
                  </div>
                  {pickupTrip ? (
                    <div style={{ background:"#F8FAFF", borderRadius:10, padding:"10px 12px" }}>
                      <p style={{ fontSize:13, fontWeight:700, color:"#0F172A", margin:"0 0 3px" }}>{pickupTrip.routes?.name || "—"}</p>
                      <p style={{ fontSize:12, color:"#64748B", margin:0 }}>Driver: {pickupTrip.drivers?.name || "—"} · {pickupTrip.cars?.number || "—"}</p>
                    </div>
                  ) : <p style={{ fontSize:13, color:"#94A3B8", margin:0 }}>No pickup trip assigned yet</p>}
                </div>

                <div style={S.card}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                    <span style={{ fontSize:20 }}>🏠</span>
                    <p style={{ fontWeight:800, color:"#0F172A", fontSize:14, margin:0 }}>Today's Drop</p>
                    {dropTrip && <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:99, background:dropTrip.status==="in_progress"?"rgba(16,185,129,.1)":"rgba(16,185,129,.08)", color:dropTrip.status==="in_progress"?"#059669":"#10b981", border:`1px solid ${dropTrip.status==="in_progress"?"rgba(16,185,129,.25)":"rgba(16,185,129,.2)"}` }}>{dropTrip.status==="in_progress"?"🟢 Dropping now":dropTrip.status==="completed"?"✅ Done":"🟡 Scheduled"}</span>}
                  </div>
                  {dropTrip ? (
                    <div style={{ background:"#F0FDF4", borderRadius:10, padding:"10px 12px" }}>
                      <p style={{ fontSize:13, fontWeight:700, color:"#0F172A", margin:"0 0 3px" }}>{dropTrip.routes?.name || "—"}</p>
                      <p style={{ fontSize:12, color:"#64748B", margin:0 }}>Driver: {dropTrip.drivers?.name || "—"} · {dropTrip.cars?.number || "—"}</p>
                    </div>
                  ) : <p style={{ fontSize:13, color:"#94A3B8", margin:0 }}>No drop trip assigned yet</p>}
                </div>
              </>
            )}

            <div style={S.card}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <div style={{ width:34,height:34,borderRadius:10,background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}><Ic n="pin" c="w-4 h-4 text-blue-600"/></div>
                <div>
                  <p style={{ fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:"#94A3B8",margin:0 }}>Your Pickup Location</p>
                  <p style={{ fontSize:13,fontWeight:700,color:"#334155",margin:0,marginTop:2 }}>{employee.address || "Not set"}</p>
                </div>
              </div>
              {employee.lat && employee.lng
                ? <PickupMap lat={employee.lat} lng={employee.lng} address={employee.address}/>
                : <div style={{ background:"#F8FAFC",borderRadius:12,height:120,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:"1.5px dashed #E2E8F0",gap:6 }}>
                    <span style={{ fontSize:28 }}>📍</span>
                    <p style={{ fontSize:12,color:"#94A3B8",fontWeight:600,margin:0 }}>No coordinates captured</p>
                  </div>}
            </div>
          </div>
        )}

        {/* ── MY TRIPS TAB ── */}
        {tab === "trips" && (
          <div style={{ padding:"16px 14px 0" }}>
            <div style={{ marginBottom:16 }}>
              <h2 style={{ fontSize:18, fontWeight:800, color:"#0F172A", margin:"0 0 4px" }}>My Trips</h2>
              <p style={{ fontSize:13, color:"#94A3B8", margin:0 }}>Your assigned pickup and drop trips</p>
            </div>
            {!pickupTrip && !dropTrip ? (
              <div style={{ textAlign:"center", padding:"40px 20px", background:"white", borderRadius:16, boxShadow:"0 2px 12px rgba(0,0,0,.06)" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🚌</div>
                <p style={{ fontWeight:700, color:"#0F172A", fontSize:16 }}>No Trips Assigned Yet</p>
                <p style={{ color:"#94A3B8", fontSize:13 }}>Once admin creates a trip and adds you, it will appear here.</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:"#94A3B8", margin:"0 0 8px" }}>Pickup Trip</p>
                {pickupTrip ? <TripCard trip={pickupTrip} pickupStatus={pickupTrip.my_status} type="pickup"/> : <div style={{ background:"#F8FAFC", borderRadius:14, padding:"14px 16px", marginBottom:12, textAlign:"center", color:"#94A3B8", fontSize:13 }}>No pickup trip assigned</div>}
                <p style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:"#94A3B8", margin:"4px 0 8px" }}>Drop Trip</p>
                {dropTrip ? <TripCard trip={dropTrip} pickupStatus={dropTrip.my_status} type="drop"/> : <div style={{ background:"#F8FAFC", borderRadius:14, padding:"14px 16px", marginBottom:12, textAlign:"center", color:"#94A3B8", fontSize:13 }}>No drop trip assigned</div>}
              </>
            )}
          </div>
        )}

        {/* ── LIVE TRACKING TAB ── */}
        {tab === "tracking" && (
          <div style={{ padding:"16px 14px 0" }}>
            <div style={{ marginBottom:14 }}>
              <h2 style={{ fontSize:18, fontWeight:800, color:"#0F172A", margin:"0 0 4px" }}>Live Tracking</h2>
              <p style={{ fontSize:13, color:"#94A3B8", margin:0 }}>Real-time location of your driver</p>
            </div>
            {!liveTrip ? (
              <div style={{ textAlign:"center", padding:"40px 20px", background:"white", borderRadius:16, boxShadow:"0 2px 12px rgba(0,0,0,.06)" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📍</div>
                <p style={{ fontWeight:700, color:"#0F172A", fontSize:16 }}>No Active Trip</p>
                <p style={{ color:"#94A3B8", fontSize:13 }}>Live tracking becomes available once a driver starts your trip.</p>
                {(pickupTrip || dropTrip) && (
                  <p style={{ color:"#94A3B8", fontSize:12, marginTop:8 }}>
                    Your {pickupTrip?.status === "scheduled" ? "pickup" : "drop"} trip is scheduled — check back when it starts.
                  </p>
                )}
              </div>
            ) : (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:12, background:"white", borderRadius:14, padding:"12px 14px", marginBottom:12, boxShadow:"0 2px 8px rgba(0,0,0,.04)" }}>
                  <div style={{ width:40,height:40,borderRadius:12,background:`linear-gradient(135deg,${avtGrad(liveTrip.drivers?.name||"?")})`,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:14,flexShrink:0 }}>
                    {initials(liveTrip.drivers?.name || "?")}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:14, fontWeight:800, color:"#0F172A", margin:"0 0 2px" }}>{liveTrip.drivers?.name || "—"}</p>
                    <p style={{ fontSize:12, color:"#94A3B8", margin:0 }}>{liveTrip.cars?.number || "—"} · {liveTrip.trip_type === "pickup" ? "🚐 Pickup" : "🏠 Drop"}</p>
                  </div>
                  <span style={{ display:"flex",alignItems:"center",gap:5,background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.2)",color:"#059669",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700 }}>
                    <span style={{ width:6,height:6,borderRadius:"50%",background:"#10b981",display:"inline-block",animation:"ep-live 1.5s ease-in-out infinite" }}/>LIVE
                  </span>
                </div>
                {liveTrip.drivers?.phone && (
                  <a href={`tel:${liveTrip.drivers.phone}`} style={{ display:"flex", alignItems:"center", gap:8, background:"#F0FDF4", border:"1.5px solid #BBF7D0", borderRadius:10, padding:"10px 14px", color:"#166634", fontWeight:700, fontSize:13, textDecoration:"none", marginBottom:12 }}>
                    <Ic n="phone" c="w-4 h-4"/> Call Driver: {liveTrip.drivers.phone}
                  </a>
                )}
                <LiveTrackingMap driverId={liveTrip.driver_id} tripId={liveTrip.id}/>
              </>
            )}
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {tab === "profile" && (
          <div style={{ padding:"16px 14px 0" }}>
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ width:72,height:72,borderRadius:"50%",background:`linear-gradient(135deg,${grad})`,display:"inline-flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:900,fontSize:24,boxShadow:"0 8px 24px rgba(91,91,214,.35)",marginBottom:10 }}>
                {initials(employee.name)}
              </div>
              <h2 style={{ fontSize:18, fontWeight:800, color:"#0F172A", margin:"0 0 4px" }}>{employee.name}</h2>
              <p style={{ fontSize:12, color:"#94A3B8", margin:"0 0 8px" }}>{employee.email}</p>
              <StatusBadge status={employee.status}/>
            </div>
            <div style={S.card}>
              {[
                { label:"Employee ID", value:employee.id },
                { label:"Phone",       value:employee.phone },
                { label:"Department",  value:employee.department },
                { label:"Office",      value:employee.office },
                { label:"Shift",       value:employee.shift || "09:00 AM" },
                { label:"Address",     value:employee.address },
              ].map(({ label, value }) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #F1F5F9" }}>
                  <span style={{ fontSize:12,color:"#94A3B8",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em" }}>{label}</span>
                  <span style={{ fontSize:13,fontWeight:700,color:"#0F172A",textAlign:"right",maxWidth:"55%" }}>{value || "–"}</span>
                </div>
              ))}
            </div>
            <button onClick={onLogout} style={{ width:"100%", background:"#FFF1F2", color:"#9F1239", border:"1.5px solid #FECDD3", borderRadius:12, padding:"12px 20px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <Ic n="logout" c="w-4 h-4"/> Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"white", borderTop:"1px solid #E4E8EF", display:"flex", padding:"8px 0 10px", zIndex:20 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", padding:"4px 0", color:tab===t.id?"#5b5bd6":"#94A3B8", position:"relative" }}>
            <Ic n={t.icon} c={`w-5 h-5 ${tab===t.id?"text-indigo-600":"text-slate-400"}`}/>
            <span style={{ fontSize:10, fontWeight:700 }}>{t.label}</span>
            {tab===t.id && <span style={{ width:16, height:3, borderRadius:99, background:"#5b5bd6" }}/>}
            {t.id==="tracking" && liveTrip && tab!=="tracking" && (
              <span style={{ position:"absolute", top:4, right:"calc(50% - 12px)", width:7, height:7, borderRadius:"50%", background:"#10b981", animation:"ep-live 1.5s ease-in-out infinite" }}/>
            )}
            {t.id==="trips" && (pickupTrip || dropTrip) && tab!=="trips" && (
              <span style={{ position:"absolute", top:3, right:"calc(50% - 14px)", width:7, height:7, borderRadius:"50%", background:"#5b5bd6" }}/>
            )}
          </button>
        ))}
      </div>
      <style>{`@keyframes ep-live{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}

/* ─── MAIN ─── */
export default function EmployeePortal() {
  const [state,    setState]    = useState("loading");
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setState("auth"); return; }
      const { data } = await supabase.from("employees").select("*").eq("user_id", session.user.id).single();
      if (data) { setEmployee(data); setState("dashboard"); }
      else setState("auth");
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setState("auth");
    setEmployee(null);
  };

  const handleSuccess = async (emp) => {
    const { data } = await supabase.from("employees").select("*").eq("id", emp.id).single();
    setEmployee(data || emp);
    setState("dashboard");
  };

  if (state === "loading")   return <Spinner/>;
  if (state === "auth")      return <OnboardingForm onSuccess={handleSuccess}/>;
  return <EmployeeDashboard employee={employee} onLogout={handleLogout}/>;
}