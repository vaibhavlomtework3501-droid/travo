import { useEffect } from "react";
import { PATHS } from "../data/constants";

/* ════════════════ ICON ════════════════ */
export const Ic = ({ n, c = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className={c}>
    <path strokeLinecap="round" strokeLinejoin="round" d={PATHS[n] || ""} />
  </svg>
);

/* ════════════════ AVATAR ════════════════ */
const AVT_GLOW = [
  ["#6366f1","#8b5cf6"], ["#0ea5e9","#06b6d4"], ["#10b981","#059669"],
  ["#f59e0b","#f97316"], ["#ec4899","#e11d48"], ["#8b5cf6","#7c3aed"],
];
export const Avt = ({ name = "?", sz = "w-9 h-9", tx = "text-sm" }) => {
  const [a, b] = AVT_GLOW[(name || "?").charCodeAt(0) % AVT_GLOW.length];
  return (
    <div className={`${sz} rounded-xl flex items-center justify-center text-white font-bold ${tx} flex-shrink-0`}
      style={{ background: `linear-gradient(135deg, ${a}, ${b})`, boxShadow: `0 2px 8px ${a}44` }}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
};

/* ════════════════ BADGE ════════════════ */
const BADGE_MAP = {
  pending:     { bg: "#fffbeb", text: "#92400e", dot: "#f59e0b", border: "#fde68a" },
  approved:    { bg: "#f0fdf4", text: "#166534", dot: "#22c55e", border: "#bbf7d0" },
  rejected:    { bg: "#fff1f2", text: "#9f1239", dot: "#f43f5e", border: "#fecdd3" },
  active:      { bg: "#eff6ff", text: "#1e40af", dot: "#3b82f6", border: "#bfdbfe" },
  available:   { bg: "#f0fdf4", text: "#166534", dot: "#22c55e", border: "#bbf7d0" },
  "on-leave":  { bg: "#f8fafc", text: "#475569", dot: "#94a3b8", border: "#e2e8f0" },
  maintenance: { bg: "#fff7ed", text: "#9a3412", dot: "#f97316", border: "#fed7aa" },
};
export const Badge = ({ s }) => {
  const style = BADGE_MAP[s] || { bg: "#f8fafc", text: "#475569", dot: "#94a3b8", border: "#e2e8f0" };
  return (
    <span style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold">
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: style.dot }} />
      {s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
};

/* ════════════════ CAPACITY BAR ════════════════ */
export const CapBar = ({ used, total }) => {
  const pct = total ? Math.round((used / total) * 100) : 0;
  const [a, b] = pct >= 90 ? ["#ef4444","#f43f5e"] : pct >= 60 ? ["#f59e0b","#f97316"] : ["#10b981","#06b6d4"];
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${a}, ${b})` }} />
      </div>
      <span className="text-xs font-bold text-slate-400 tabular-nums whitespace-nowrap">{used}/{total}</span>
    </div>
  );
};

/* ════════════════ FORM ════════════════ */
export const Inp = ({ className = "", ...p }) => (
  <input {...p}
    className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-all outline-none
      bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-300
      focus:bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100 ${className}`} />
);

export const Sel = ({ children, className = "", ...p }) => (
  <select {...p}
    className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-all outline-none cursor-pointer
      bg-slate-50 border-slate-200 text-slate-800
      focus:bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100 ${className}`}>
    {children}
  </select>
);

export const Lbl = ({ children }) => (
  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{children}</label>
);

/* ════════════════ BUTTON ════════════════ */
export const Btn = ({ v = "primary", className = "", children, ...p }) => {
  const V = {
    primary:   "text-white shadow-lg hover:shadow-xl hover:brightness-110",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm",
    danger:    "text-white shadow-lg hover:shadow-xl hover:brightness-110",
    success:   "text-white shadow-lg hover:shadow-xl hover:brightness-110",
    ghost:     "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
  };
  const BG = {
    primary: "linear-gradient(135deg, #5b5bd6, #7c3aed)",
    danger:  "linear-gradient(135deg, #ef4444, #f43f5e)",
    success: "linear-gradient(135deg, #10b981, #06b6d4)",
  };
  return (
    <button {...p}
      style={BG[v] ? { background: BG[v] } : {}}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
        transition-all duration-200 active:scale-[.97] hover:scale-[1.02]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:brightness-100
        ${V[v]} ${className}`}>
      {children}
    </button>
  );
};

/* ════════════════ PAGE HEADER ════════════════ */
export const PageHeader = ({ title, sub, children }) => (
  <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
    <div>
      <h1 className="font-display font-black text-[1.6rem] text-slate-900 tracking-tight leading-none">{title}</h1>
      {sub && <p className="text-sm text-slate-400 mt-1.5 font-medium">{sub}</p>}
    </div>
    {children && <div className="flex items-center gap-2.5 flex-wrap">{children}</div>}
  </div>
);

/* ════════════════ CARD ════════════════ */
export const Card = ({ children, className = "", hover = false, style = {} }) => (
  <div style={{ background: "var(--card)", border: "1px solid var(--border)", ...style }}
    className={`rounded-2xl shadow-sm ${hover ? "card-lift cursor-pointer" : ""} ${className}`}>
    {children}
  </div>
);

/* ════════════════ SECTION HEADER (inside card) ════════════════ */
export const SectionHead = ({ title, action }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
    <p className="font-display font-bold text-slate-800 text-sm">{title}</p>
    {action}
  </div>
);

/* ════════════════ SEARCH ════════════════ */
export const SearchInp = ({ value, onChange, placeholder = "Search…", className = "" }) => (
  <div className="relative">
    <Ic n="search" c="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    <input value={value} onChange={onChange} placeholder={placeholder}
      className={`bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700
        placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100
        transition-all w-48 ${className}`} />
  </div>
);

/* ════════════════ EMPTY STATE ════════════════ */
export const Empty = ({ icon = "search", text = "Nothing here yet", sub = "" }) => (
  <div className="py-16 text-center">
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
      style={{ background: "linear-gradient(135deg,#f8fafc,#f1f5f9)" }}>
      <Ic n={icon} c="w-7 h-7 text-slate-300" />
    </div>
    <p className="text-sm font-bold text-slate-300">{text}</p>
    {sub && <p className="text-xs text-slate-200 mt-1">{sub}</p>}
  </div>
);

/* ════════════════ STAT PILL ════════════════ */
export const StatPill = ({ label, value, color = "#5b5bd6" }) => (
  <div className="rounded-xl px-4 py-2 text-center" style={{ background: color + "12", border: `1px solid ${color}22` }}>
    <p className="text-xl font-display font-black" style={{ color }}>{value}</p>
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{label}</p>
  </div>
);

/* ════════════════ TOAST ════════════════ */
export const Toast = ({ msg, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  const CFG = {
    success: { bg: "linear-gradient(135deg,#059669,#0d9488)", icon: "check" },
    error:   { bg: "linear-gradient(135deg,#dc2626,#e11d48)", icon: "warn" },
    info:    { bg: "linear-gradient(135deg,#5b5bd6,#7c3aed)", icon: "bell" },
  };
  const cfg = CFG[type] || CFG.info;
  return (
    <div className="fixed bottom-6 right-6 z-[300] ti flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white text-sm font-semibold"
      style={{ background: cfg.bg, boxShadow: "0 16px 48px rgba(0,0,0,.25), 0 0 0 1px rgba(255,255,255,.12)" }}>
      <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
        <Ic n={cfg.icon} c="w-4 h-4" />
      </div>
      {msg}
    </div>
  );
};

/* ════════════════ MODAL ════════════════ */
export const Modal = ({ open, onClose, title, children, wide }) => {
  useEffect(() => {
    const h = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 fi"
      style={{ background: "rgba(13,15,20,.6)", backdropFilter: "blur(10px)" }}
      onClick={onClose}>
      <div className={`bg-white rounded-3xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto fu`}
        style={{ boxShadow: "0 40px 100px rgba(0,0,0,.22), 0 0 0 1px rgba(0,0,0,.06)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid #f1f5f9" }}>
          <h2 className="font-display font-bold text-lg text-slate-900">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
            <Ic n="x" c="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

/* ════════════════ CONFIRM ════════════════ */
export const Confirm = ({ open, msg, onYes, onNo }) => (
  <Modal open={open} onClose={onNo} title="Confirm Action">
    <div className="flex items-start gap-4 mb-6">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "linear-gradient(135deg,#fee2e2,#fecdd3)" }}>
        <Ic n="warn" c="w-5 h-5 text-rose-500" />
      </div>
      <p className="text-slate-600 text-sm leading-relaxed pt-2">{msg}</p>
    </div>
    <div className="flex gap-3">
      <Btn v="secondary" className="flex-1" onClick={onNo}>Cancel</Btn>
      <Btn v="danger" className="flex-1" onClick={onYes}>Confirm</Btn>
    </div>
  </Modal>
);

/* ════════════════ TABLE WRAPPER ════════════════ */
export const Table = ({ headers, children, minW = "560px" }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm" style={{ minWidth: minW }}>
      <thead>
        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
          {headers.map(h => (
            <th key={h} className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">{children}</tbody>
    </table>
  </div>
);

/* ════════════════ TAB BAR ════════════════ */
export const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex gap-0.5 p-1 rounded-xl" style={{ background: "#f1f5f9" }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)}
        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200
          ${active === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
        {t.label}
        {t.count !== undefined && (
          <span className={`ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full
            ${active === t.id ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-400"}`}>
            {t.count}
          </span>
        )}
      </button>
    ))}
  </div>
);
