import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { Ic } from "./UI";

/* ── ETRAVO Brand Logo ── */
function EtravoLogo({ size = "md" }) {
  const s = size === "sm" ? { icon:32, font:16 } : { icon:40, font:20 };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      {/* Icon mark: stylised route pin */}
      <svg width={s.icon} height={s.icon} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="url(#etravo-grad)"/>
        <defs>
          <linearGradient id="etravo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5b5bd6"/>
            <stop offset="1" stopColor="#0ea5e9"/>
          </linearGradient>
        </defs>
        {/* Road/route path */}
        <path d="M10 28 Q14 20 20 20 Q26 20 30 12" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.5"/>
        {/* Location pin at destination */}
        <circle cx="30" cy="11" r="4.5" fill="white" opacity="0.95"/>
        <circle cx="30" cy="11" r="2" fill="url(#etravo-grad)"/>
        {/* Arrow chevron on path */}
        <path d="M17 22.5 L20 19.5 L23 22.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        {/* Start dot */}
        <circle cx="10" cy="28" r="2.5" fill="white" opacity="0.8"/>
      </svg>
      {/* Wordmark */}
      <span style={{ fontWeight:900, fontSize:s.font, letterSpacing:"-0.02em", color:"white", fontFamily:"inherit" }}>
        ETRAVO
      </span>
    </div>
  );
}

export default function LoginPage() {
  const { signIn, resetPassword } = useAuth();
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    const { error: err } = await signIn(email, password);
    if (err) setError(err.message || "Invalid credentials");
    setLoading(false);
  };
  const handleReset = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    const { error: err } = await resetPassword(email);
    if (err) setError(err.message);
    else setResetSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#0d0f14" }}>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden p-12">
        {/* Background */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 80% 70% at 20% 30%, rgba(91,91,214,.3) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 70%, rgba(14,165,233,.2) 0%, transparent 60%)"
        }}/>
        {/* Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]">
          <defs><pattern id="g" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M44 0L0 0 0 44" fill="none" stroke="white" strokeWidth="1"/>
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
        </svg>

        <div className="relative z-10 flex-1 flex flex-col">
          {/* Logo */}
          <div className="mb-16">
            <EtravoLogo size="md" />
          </div>

          {/* Hero */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="font-display font-black text-white text-5xl leading-tight mb-5">
              Fleet management<br/>
              <span style={{ color:"#0ea5e9" }}>reimagined.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
              Real-time tracking, smart routing, and complete visibility over your entire transport operation.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3 mt-8">
              {["Live GPS Tracking","Smart Route Planner","Driver Management","Boarding Control"].map(f => (
                <span key={f} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold"
                  style={{ background:"rgba(255,255,255,.07)", color:"rgba(255,255,255,.7)", border:"1px solid rgba(255,255,255,.1)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-auto">
            {[["24/7","Operations"],["100%","Uptime"],["Real-time","Tracking"]].map(([v,l]) => (
              <div key={l} className="rounded-2xl p-4" style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)" }}>
                <p className="font-display font-black text-white text-xl">{v}</p>
                <p className="text-slate-500 text-xs mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Logo (mobile) */}
          <div className="mb-8 lg:hidden">
            <EtravoLogo size="sm" />
          </div>

          <h2 className="font-display font-black text-white text-3xl mb-1">
            {resetMode ? "Reset password" : "Welcome back"}
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            {resetMode ? "Enter your email to receive a reset link" : "Sign in to manage your fleet"}
          </p>

          {resetSent ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background:"rgba(16,185,129,.15)" }}>
                <Ic n="check" c="w-7 h-7 text-emerald-400"/>
              </div>
              <p className="text-white font-bold text-lg mb-2">Check your email</p>
              <p className="text-slate-400 text-sm">Reset link sent to {email}</p>
              <button onClick={()=>{setResetMode(false);setResetSent(false);}}
                className="mt-6 text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition-colors">
                ← Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={resetMode ? handleReset : handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Email</label>
                <div className="relative">
                  <Ic n="mail" c="w-4 h-4 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"/>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                    placeholder="admin@transportx.in"
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white font-medium outline-none transition-all"
                    style={{ background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.1)" }}
                    onFocus={e=>e.target.style.border="1px solid rgba(91,91,214,.5)"}
                    onBlur={e=>e.target.style.border="1px solid rgba(255,255,255,.1)"}/>
                </div>
              </div>

              {!resetMode && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Password</label>
                    <button type="button" onClick={()=>setResetMode(true)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Ic n="lock" c="w-4 h-4 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"/>
                    <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-3 rounded-xl text-sm text-white font-medium outline-none transition-all"
                      style={{ background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.1)" }}
                      onFocus={e=>e.target.style.border="1px solid rgba(91,91,214,.5)"}
                      onBlur={e=>e.target.style.border="1px solid rgba(255,255,255,.1)"}/>
                    <button type="button" onClick={()=>setShowPass(o=>!o)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors">
                      <Ic n={showPass?"eyeOff":"eye"} c="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400"
                  style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.2)" }}>
                  <Ic n="warn" c="w-4 h-4 flex-shrink-0"/>{error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:brightness-110 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                style={{ background:"linear-gradient(135deg,#5b5bd6,#7c3aed)", boxShadow:"0 8px 24px rgba(91,91,214,.4)" }}>
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spn"/> Signing in…</>
                ) : (
                  resetMode ? "Send reset link" : "Sign in"
                )}
              </button>

              {resetMode && (
                <button type="button" onClick={()=>setResetMode(false)}
                  className="w-full text-center text-sm text-slate-500 hover:text-slate-400 font-semibold transition-colors py-2">
                  ← Back to sign in
                </button>
              )}
            </form>
          )}

        </div>
      </div>
    </div>
  );
}