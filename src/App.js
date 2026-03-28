import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   ORACLE PL/SQL SIMULATION LAYER
   In production: AJAX → Oracle REST Data Services (ORDS) → PL/SQL procedures
   ═══════════════════════════════════════════════════════════════════════════ */
import * as API from './api';

/* ═══════════════════════════════════════════════════════════════════════════
   GLOBAL STYLES — MAHE Mobility Cyberpunk
   ═══════════════════════════════════════════════════════════════════════════ */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }

    :root {
      --bg:       #050a05;
      --bg2:      #080e08;
      --surface:  #0d1a0d;
      --surface2: #0a150a;
      --green:    #00ff88;
      --green2:   #00cc6a;
      --glow:     rgba(0,255,136,.18);
      --glow2:    rgba(0,255,136,.06);
      --orange:   #ff6b35;
      --cyan:     #00c8ff;
      --red:      #ff3860;
      --yellow:   #ffd600;
      --border:   rgba(0,255,136,.18);
      --border2:  rgba(0,255,136,.08);
      --muted:    #3d5c3d;
      --muted2:   #5a7a5a;
      --text:     #a8c8a8;
      --white:    #e0f0e0;
      --mono:     'Share Tech Mono', monospace;
      --display:  'Orbitron', sans-serif;
      --body:     'DM Sans', sans-serif;
    }

    html { scroll-behavior:smooth; }
    body {
      font-family: var(--body);
      background: var(--bg);
      color: var(--text);
      overflow-x: hidden;
      cursor: crosshair;
    }
    ::selection { background:var(--glow); color:var(--green); }
    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-track { background:var(--bg); }
    ::-webkit-scrollbar-thumb { background:var(--green2); border-radius:2px; }

    /* CRT scanlines */
    body::before {
      content:''; position:fixed; inset:0; pointer-events:none; z-index:9998;
      background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.07) 2px,rgba(0,0,0,.07) 4px);
    }

    /* Grid bg */
    .grid-bg {
      background-image:
        linear-gradient(rgba(0,255,136,.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,255,136,.03) 1px, transparent 1px);
      background-size: 40px 40px;
    }

    /* ── Animations ── */
    @keyframes blink     { 0%,100%{opacity:1}  50%{opacity:0} }
    @keyframes fadeUp    { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
    @keyframes glitch1   { 0%,100%{clip-path:inset(0 0 98% 0)} 20%{clip-path:inset(20% 0 60% 0)} 40%{clip-path:inset(60% 0 20% 0)} }
    @keyframes glitch2   { 0%,100%{clip-path:inset(98% 0 0 0);transform:translateX(-3px)} 30%{clip-path:inset(40% 0 40% 0);transform:translateX(3px)} }
    @keyframes pulse     { 0%,100%{box-shadow:0 0 6px var(--green)} 50%{box-shadow:0 0 18px var(--green)} }
    @keyframes drift     { 0%{transform:translate(0,0)} 33%{transform:translate(8px,-8px)} 66%{transform:translate(-6px,12px)} 100%{transform:translate(0,0)} }
    @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes slideIn   { from{transform:translateX(-20px);opacity:0} to{transform:translateX(0);opacity:1} }
    @keyframes toast_in  { from{transform:translateX(60px);opacity:0} to{transform:translateX(0);opacity:1} }
    @keyframes spin      { to{transform:rotate(360deg)} }
    @keyframes rowIn     { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
    @keyframes scanBar   { 0%{top:-5%} 100%{top:105%} }

    .fade-up  { animation: fadeUp .6s cubic-bezier(.22,.68,0,1.2) both; }
    .fade-in  { animation: fadeIn .4s ease both; }
    .blink    { animation: blink 1s step-end infinite; }
    .spin     { animation: spin .8s linear infinite; }

    /* ── Glitch ── */
    .glitch { position:relative; }
    .glitch::before,.glitch::after { content:attr(data-text); position:absolute; inset:0; color:var(--green); }
    .glitch::before { text-shadow:2px 0 var(--red);  animation:glitch1 3.5s infinite linear; opacity:.7; }
    .glitch::after  { text-shadow:-2px 0 var(--cyan); animation:glitch2 2.5s infinite linear; opacity:.7; }

    /* ── Neon border card ── */
    .neon-card {
      background:var(--surface); border:1px solid var(--border2);
      position:relative; overflow:hidden; transition:all .35s;
      clip-path:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px);
    }
    .neon-card::before {
      content:''; position:absolute; top:0;left:0;right:0;height:1px;
      background:linear-gradient(90deg,transparent,var(--green),transparent);
      opacity:0; transition:opacity .35s;
    }
    .neon-card::after {
      content:''; position:absolute; inset:0; pointer-events:none;
      background:radial-gradient(ellipse at top left,rgba(0,255,136,.05) 0%,transparent 55%);
      opacity:0; transition:opacity .35s;
    }
    .neon-card:hover::before,.neon-card:hover::after { opacity:1; }
    .neon-card:hover { border-color:var(--border); transform:translateY(-3px); box-shadow:0 8px 32px rgba(0,0,0,.5); }

    /* ── Button ── */
    .btn-neon {
      font-family:var(--mono); font-size:11px; letter-spacing:.12em; text-transform:uppercase;
      padding:11px 26px; background:transparent; color:var(--green);
      border:1px solid var(--green); cursor:pointer; position:relative; overflow:hidden;
      transition:all .3s;
      clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);
    }
    .btn-neon::before { content:''; position:absolute; inset:0; background:var(--green); transform:translateX(-105%); transition:transform .3s; z-index:0; }
    .btn-neon:hover { color:var(--bg); }
    .btn-neon:hover::before { transform:translateX(0); }
    .btn-neon span { position:relative; z-index:1; }

    .btn-ghost {
      font-family:var(--mono); font-size:10px; letter-spacing:.1em; text-transform:uppercase;
      padding:8px 18px; background:transparent; color:var(--muted2);
      border:1px solid var(--border2); cursor:pointer; transition:all .25s;
    }
    .btn-ghost:hover { color:var(--green); border-color:var(--green); }

    .btn-danger {
      font-family:var(--mono); font-size:10px; letter-spacing:.1em; text-transform:uppercase;
      padding:8px 16px; background:transparent; color:var(--red);
      border:1px solid rgba(255,56,96,.3); cursor:pointer; transition:all .25s;
    }
    .btn-danger:hover { background:rgba(255,56,96,.1); border-color:var(--red); }

    /* ── Tags ── */
    .tag  { display:inline-block; padding:2px 9px; font-family:var(--mono); font-size:9px; letter-spacing:.08em; border-radius:2px; }
    .tag-green  { border:1px solid rgba(0,255,136,.25); background:rgba(0,255,136,.06); color:var(--green2); }
    .tag-orange { border:1px solid rgba(255,107,53,.3);  background:rgba(255,107,53,.08); color:var(--orange); }
    .tag-red    { border:1px solid rgba(255,56,96,.3);   background:rgba(255,56,96,.08);  color:var(--red);    }
    .tag-cyan   { border:1px solid rgba(0,200,255,.25);  background:rgba(0,200,255,.06);  color:var(--cyan);   }
    .tag-muted  { border:1px solid var(--border2);       background:rgba(255,255,255,.02); color:var(--muted2); }
    .tag-yellow { border:1px solid rgba(255,214,0,.25);  background:rgba(255,214,0,.06);  color:var(--yellow); }

    /* ── Mono text ── */
    .mono    { font-family:var(--mono); }
    .display { font-family:var(--display); }

    /* ── Skeleton ── */
    .skeleton {
      background:linear-gradient(90deg,var(--surface) 25%,rgba(0,255,136,.05) 50%,var(--surface) 75%);
      background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:2px;
    }

    /* ── Dot ── */
    .dot { width:7px;height:7px;border-radius:50%;display:inline-block;flex-shrink:0; }
    .dot-green  { background:var(--green);  animation:pulse 2s infinite; }
    .dot-orange { background:var(--orange); }
    .dot-red    { background:var(--red);    }
    .dot-muted  { background:var(--muted2); }

    /* ── Table ── */
    .cyber-table { width:100%; border-collapse:collapse; }
    .cyber-table th {
      font-family:var(--mono); font-size:9px; letter-spacing:.14em; text-transform:uppercase;
      color:var(--muted2); padding:12px 16px; border-bottom:1px solid var(--border2);
      text-align:left; font-weight:400;
    }
    .cyber-table td { padding:13px 16px; border-bottom:1px solid rgba(0,255,136,.04); font-size:13px; vertical-align:middle; }
    .cyber-table tbody tr { transition:background .18s; animation:rowIn .4s ease both; }
    .cyber-table tbody tr:hover { background:rgba(0,255,136,.04); }

    /* ── Input ── */
    .cyber-input {
      width:100%; padding:10px 14px; background:var(--bg); color:var(--white);
      border:1px solid var(--border2); font-family:var(--mono); font-size:12px;
      outline:none; transition:border-color .2s, box-shadow .2s;
    }
    .cyber-input:focus { border-color:var(--green); box-shadow:0 0 0 2px var(--glow); }
    .cyber-input::placeholder { color:var(--muted); }
    select.cyber-input option { background:var(--surface); }
    label.cyber-label {
      display:block; font-family:var(--mono); font-size:9px; letter-spacing:.14em;
      text-transform:uppercase; color:var(--muted2); margin-bottom:6px;
    }

    /* ── Sidebar ── */
    .sidebar-item {
      display:flex; align-items:center; gap:12px; padding:11px 14px;
      font-family:var(--mono); font-size:11px; letter-spacing:.08em; text-transform:uppercase;
      color:var(--muted2); cursor:pointer; border:1px solid transparent;
      transition:all .2s; background:transparent; width:100%; text-align:left;
    }
    .sidebar-item:hover { color:var(--green); border-color:var(--border2); background:rgba(0,255,136,.03); }
    .sidebar-item.active { color:var(--green); border-color:var(--border); background:rgba(0,255,136,.06); }

    /* ── Section label ── */
    .sect-label {
      font-family:var(--mono); font-size:9px; letter-spacing:.2em; text-transform:uppercase;
      color:var(--green); margin-bottom:8px; display:flex; align-items:center; gap:10px;
    }
    .sect-label::before { content:'//'; color:var(--muted); }

    /* ── Modal ── */
    .modal-back {
      position:fixed; inset:0; background:rgba(0,0,0,.8);
      backdrop-filter:blur(8px); z-index:1000;
      display:flex; align-items:center; justify-content:center; padding:20px;
      animation:fadeIn .2s ease;
    }
    .modal-box {
      background:var(--surface); border:1px solid var(--border);
      width:100%; max-width:520px; max-height:90vh; overflow-y:auto;
      animation:fadeUp .3s cubic-bezier(.22,.68,0,1.2);
      clip-path:polygon(16px 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%,0 16px);
      box-shadow:0 0 60px rgba(0,255,136,.1);
    }

    /* ── Toast ── */
    .toast {
      position:fixed; bottom:28px; right:28px; z-index:2000;
      min-width:300px; padding:14px 18px;
      border:1px solid; display:flex; align-items:center; gap:12px;
      font-family:var(--mono); font-size:12px; letter-spacing:.04em;
      animation:toast_in .35s cubic-bezier(.22,.68,0,1.2);
      background:var(--surface);
    }
    .toast-success { border-color:rgba(0,255,136,.4); color:var(--green); box-shadow:0 0 30px rgba(0,255,136,.1); }
    .toast-error   { border-color:rgba(255,56,96,.4);  color:var(--red);   box-shadow:0 0 30px rgba(255,56,96,.1); }

    /* ── SQL panel ── */
    .sql-panel {
      background:#010e01; border:1px solid var(--border2);
      padding:18px; font-family:var(--mono); font-size:12px;
      line-height:1.8; overflow-x:auto;
    }
    .sql-kw  { color:#ff7b72; }
    .sql-fn  { color:#d2a8ff; }
    .sql-str { color:#a5d6ff; }
    .sql-cm  { color:#3d5c3d; }
    .sql-num { color:var(--cyan); }
    .sql-tb  { color:var(--green); }

    /* ── Progress bar ── */
    .prog { height:4px; background:var(--surface); overflow:hidden; }
    .prog-fill { height:100%; background:var(--green); transition:width .8s cubic-bezier(.22,.68,0,1.2); }

    /* ── Stat card ── */
    .stat-card {
      padding:24px; background:var(--surface); border:1px solid var(--border2);
      position:relative; overflow:hidden; transition:all .3s;
      clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px);
    }
    .stat-card::after { content:''; position:absolute; top:0;right:0; width:40px; height:40px; border-left:1px solid var(--border2); border-bottom:1px solid var(--border2); transform:translate(20px,-20px) rotate(45deg); opacity:.5; }
    .stat-card:hover { border-color:var(--border); box-shadow:0 4px 24px rgba(0,0,0,.4); }

    /* ── Scrollable ── */
    .scroll-y { overflow-y:auto; }
    .scroll-y::-webkit-scrollbar { width:3px; }
    .scroll-y::-webkit-scrollbar-thumb { background:var(--border); }
  `}</style>
);

/* ═══════════════════════════════════════════════════════════════════════════
   ICONS (inline SVG)
   ═══════════════════════════════════════════════════════════════════════════ */
const Ic = ({ n, s=16, c="currentColor" }) => {
  const d = {
    book:    <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
    users:   <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    swap:    <><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></>,
    alert:   <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    grid:    <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
    db:      <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>,
    search:  <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    plus:    <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    check:   <><polyline points="20 6 9 17 4 12"/></>,
    x:       <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    edit:    <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash:   <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></>,
    chart:   <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    shield:  <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    bell:    <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    refresh: <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></>,
    logout:  <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    filter:  <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    eye:     <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    star:    <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/></>,
    terminal:<><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></>,
    bookmark:<><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></>,
  };
  return <svg width={s} height={s} fill="none" stroke={c} strokeWidth="1.8" viewBox="0 0 24 24" style={{flexShrink:0}}>{d[n]}</svg>;
};

/* ═══════════════════════════════════════════════════════════════════════════
   CURSOR TRAIL
   ═══════════════════════════════════════════════════════════════════════════ */
const CursorTrail = () => {
  const [pts, setPts] = useState([]);
  const ref = useRef(0);
  useEffect(() => {
    const h = e => {
      const id = ++ref.current;
      setPts(p => [...p.slice(-14), { id, x:e.clientX, y:e.clientY }]);
      setTimeout(() => setPts(p => p.filter(q => q.id !== id)), 500);
    };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:9999 }}>
      {pts.map((p, i) => (
        <div key={p.id} style={{
          position:"fixed", left:p.x-1.5, top:p.y-1.5,
          width:3, height:3, borderRadius:"50%", background:"var(--green)",
          opacity:(i+1)/pts.length*0.5, transform:`scale(${(i+1)/pts.length})`,
        }} />
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   TYPEWRITER
   ═══════════════════════════════════════════════════════════════════════════ */
const Typer = ({ text, speed=35, onDone }) => {
  const [out, setOut] = useState("");
  useEffect(() => {
    setOut(""); let i=0;
    const iv = setInterval(() => {
      if (i < text.length) setOut(text.slice(0, ++i));
      else { clearInterval(iv); onDone?.(); }
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return <span>{out}<span className="blink" style={{ color:"var(--green)" }}>█</span></span>;
};

/* ═══════════════════════════════════════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════════════════════════════════════ */
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div className={`toast toast-${type}`}>
      <Ic n={type==="success" ? "check" : "alert"} s={14} c="currentColor" />
      <span>{msg}</span>
      <button onClick={onClose} style={{ marginLeft:"auto", background:"none", border:"none", color:"inherit", cursor:"pointer", opacity:.6 }}><Ic n="x" s={12} c="currentColor" /></button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MODAL
   ═══════════════════════════════════════════════════════════════════════════ */
const Modal = ({ title, sqlHint, onClose, children }) => (
  <div className="modal-back" onClick={e => e.target===e.currentTarget && onClose()}>
    <div className="modal-box">
      <div style={{ padding:"18px 24px", borderBottom:"1px solid var(--border2)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div className="sect-label" style={{ marginBottom:4 }}>{sqlHint}</div>
          <div className="display" style={{ fontSize:14, fontWeight:700, color:"var(--white)", letterSpacing:".06em" }}>{title}</div>
        </div>
        <button onClick={onClose} className="btn-ghost" style={{ padding:"5px 8px" }}><Ic n="x" s={14} c="currentColor" /></button>
      </div>
      <div style={{ padding:"22px 24px" }}>{children}</div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   SQL PANEL
   ═══════════════════════════════════════════════════════════════════════════ */
const SqlBox = ({ code }) => (
  <div className="sql-panel">
    <div style={{ display:"flex", gap:6, marginBottom:12, paddingBottom:10, borderBottom:"1px solid rgba(0,255,136,.06)" }}>
      {["#ff5f56","#ffbd2e","#27c93f"].map(c => <div key={c} style={{ width:10,height:10,borderRadius:"50%",background:c }} />)}
      <span className="mono" style={{ marginLeft:8, fontSize:9, color:"var(--muted2)", letterSpacing:".1em" }}>oracle_sql — library_db</span>
    </div>
    <pre style={{ whiteSpace:"pre-wrap" }} dangerouslySetInnerHTML={{ __html:code }} />
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   HERO / LANDING
   ═══════════════════════════════════════════════════════════════════════════ */
const Hero = ({ onEnter, onViewSchema }) => {
  const [scrollY, setScrollY] = useState(0);
  const [phase, setPhase] = useState(0); // 0=booting 1=title 2=ready
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h, { passive:true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <div className="grid-bg" style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", padding:"80px 24px" }}>
      {/* Parallax rings */}
      {[700,520,360,220,110].map((r,i) => (
        <div key={r} style={{ position:"absolute", width:r, height:r, borderRadius:"50%", border:"1px solid rgba(0,255,136,.05)", top:`calc(50% - ${r/2}px)`, left:`calc(50% - ${r/2}px)`, transform:`translateY(${scrollY*(i*.06)}px)`, animation:`drift ${12+i*5}s ease-in-out infinite`, animationDelay:`${i*1.5}s` }} />
      ))}
      {/* Particles */}
      {[...Array(28)].map((_,i) => (
        <div key={i} style={{ position:"absolute", width:i%4===0?2:1, height:i%4===0?2:1, borderRadius:"50%", background:"var(--green)", left:`${(i*41+9)%95}%`, top:`${(i*31+11)%88}%`, opacity:.05+(i%5)*.04, animation:`drift ${7+(i%5)*3}s ease-in-out infinite`, animationDelay:`${i*.25}s`, transform:`translateY(${scrollY*(.01+(i%4)*.005)}px)` }} />
      ))}

      <div style={{ position:"relative", zIndex:10, textAlign:"center", maxWidth:900, transform:`translateY(${-scrollY*.08}px)` }}>
        {/* System badge */}
        <div className="fade-up mono" style={{ animationDelay:".05s", fontSize:9, letterSpacing:".22em", color:"var(--green)", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
          <span className="dot dot-green" />
          SYSTEM ONLINE &nbsp;·&nbsp; ORACLE DB CONNECTED &nbsp;·&nbsp; LMS v2.6
        </div>

        {/* Title */}
        <h1 className="display glitch fade-up"data-text="LIBRARY MANAGEMENT SYSTEM"style={{animationDelay: ".12s",fontSize: "clamp(38px,9vw,100px)",fontWeight: 900, color: "var(--white)",lineHeight: 0.92,marginBottom: 8,}}
>         LIBRARY MANAGEMENT SYSTEM
        </h1>

        <p className="fade-up" style={{ animationDelay:".3s", fontSize:15, color:"var(--muted2)", maxWidth:560, margin:"0 auto 16px", lineHeight:1.8, fontWeight:300 }}>
          A comprehensive Oracle-backed database application for automated book cataloguing, member management, transaction tracking, and fine enforcement.
        </p>
        <div className="mono fade-up" style={{ animationDelay:".35s", fontSize:11, color:"var(--muted)", marginBottom:48 }}>
          PROJECT: LMS_ORACLE_2026 &nbsp;·&nbsp; STATUS: UPLINK_STABLE &nbsp;·&nbsp; DB: library_db@oracle19c
        </div>

        {/* Feature tags */}
        <div className="fade-up" style={{ animationDelay:".42s", display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap", marginBottom:48 }}>
          {["Book Cataloguing","Member Tiers","Fine Engine","Reservations","Role-Based Auth","SQL Triggers","Stored Procs","NF3 Schema"].map(f => (
            <span key={f} className="tag tag-muted">{f}</span>
          ))}
        </div>

        <div className="fade-up" style={{ animationDelay:".5s", display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
          <button className="btn-neon" onClick={onEnter}><span>ENTER DASHBOARD →</span></button>
          <button className="btn-ghost" onClick={onViewSchema}>VIEW SCHEMA</button>
        </div>

        {/* Stats strip */}
        <div className="fade-up" style={{ animationDelay:".62s", marginTop:64, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:1, maxWidth:680, margin:"64px auto 0", border:"1px solid var(--border2)" }}>
          {[["1,240","TOTAL BOOKS"],["312","ACTIVE MEMBERS"],["87","BOOKS ON LOAN"],["₹1.2K","PENDING FINES"]].map(([v,l]) => (
            <div key={l} style={{ padding:"20px 16px", textAlign:"center", background:"var(--surface)", borderRight:"1px solid var(--border2)" }}>
              <div className="display" style={{ fontSize:"clamp(18px,3vw,28px)", fontWeight:900, color:"var(--green)", lineHeight:1 }}>{v}</div>
              <div className="mono" style={{ fontSize:8, letterSpacing:".12em", color:"var(--muted)", marginTop:6 }}>{l}</div>
            </div>
          ))}
        </div>

        <div className="fade-up" style={{ animationDelay:".68s", marginTop:24 }}>
          <div className="mono" style={{ fontSize:9, letterSpacing:".16em", color:"var(--muted2)", marginBottom:10 }}>
            CREATED BY
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:8, maxWidth:680, margin:"0 auto" }}>
            {["Aditya Banasri", "Akshant Beuria", "Mansi Sinha"].map((name) => (
              <div key={name} className="neon-card" style={{ padding:"12px 14px", background:"var(--surface2)", borderColor:"var(--border2)" }}>
                <div className="mono" style={{ fontSize:10, color:"var(--green)", letterSpacing:".08em" }}>{name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ marginTop:48, opacity:.3 - scrollY/400 }}>
          <div className="mono" style={{ fontSize:9, letterSpacing:".2em", color:"var(--muted)", marginBottom:8 }}>SCROLL TO EXPLORE</div>
          <div style={{ width:1, height:36, background:"linear-gradient(to bottom,var(--green),transparent)", margin:"0 auto" }} />
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   SIDEBAR
   ═══════════════════════════════════════════════════════════════════════════ */
const PAGES = [
  { id:"dashboard", label:"Dashboard",     icon:"grid"     },
  { id:"books",     label:"Books",          icon:"book"     },
  { id:"members",   label:"Members",        icon:"users"    },
  { id:"issue",     label:"Issue / Return", icon:"swap"     },
  { id:"fines",     label:"Fines",          icon:"alert"    },
  { id:"reports",   label:"Reports",        icon:"chart"    },
  { id:"sql",       label:"SQL Console",    icon:"terminal" },
];

const Sidebar = ({ page, setPage, collapsed, toggle }) => (
  <aside style={{ width:collapsed?52:210, background:"var(--bg2)", borderRight:"1px solid var(--border2)", display:"flex", flexDirection:"column", flexShrink:0, transition:"width .3s cubic-bezier(.22,.68,0,1.2)", overflow:"hidden" }}>
    <div style={{ padding:"18px 12px", borderBottom:"1px solid var(--border2)", display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ width:28, height:28, border:"1px solid var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <div style={{ width:12, height:12, background:"var(--green)", clipPath:"polygon(50% 0,100% 100%,0 100%)" }} />
      </div>
      {!collapsed && <span className="display" style={{ fontSize:11, fontWeight:700, color:"var(--white)", letterSpacing:".1em", whiteSpace:"nowrap" }}>LMS</span>}
    </div>
    <nav style={{ flex:1, padding:"12px 8px", display:"flex", flexDirection:"column", gap:2 }}>
      {PAGES.map(p => (
        <button key={p.id} className={`sidebar-item ${page===p.id?"active":""}`} onClick={() => setPage(p.id)} style={{ justifyContent:collapsed?"center":"flex-start" }} title={collapsed?p.label:undefined}>
          <Ic n={p.icon} s={15} c="currentColor" />
          {!collapsed && <span>{p.label}</span>}
        </button>
      ))}
    </nav>
    <div style={{ padding:"10px 8px", borderTop:"1px solid var(--border2)" }}>
      <button className="sidebar-item" onClick={toggle} style={{ justifyContent:collapsed?"center":"flex-start" }}>
        <Ic n="filter" s={14} c="currentColor" />
        {!collapsed && <span>Collapse</span>}
      </button>
    </div>
  </aside>
);

/* ═══════════════════════════════════════════════════════════════════════════
   TOPBAR
   ═══════════════════════════════════════════════════════════════════════════ */
const Topbar = ({ page, showToast, onGoFront, overdueAlertCount }) => (
  <header style={{ height:56, background:"var(--bg2)", borderBottom:"1px solid var(--border2)", display:"flex", alignItems:"center", paddingInline:24, gap:16, flexShrink:0 }}>
    <div style={{ flex:1 }}>
      <div className="sect-label" style={{ marginBottom:0 }}>{PAGES.find(p=>p.id===page)?.label||"Dashboard"}</div>
    </div>
    <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
      <Ic n="search" s={13} c="var(--muted2)" />
      <input className="cyber-input" placeholder="SEARCH RECORDS..." style={{ width:220, height:32, fontSize:11, paddingLeft:28 }} />
    </div>
    <button
      className="btn-ghost"
      style={{ padding:"5px 9px", position:"relative" }}
      onClick={() =>
        overdueAlertCount > 0
          ? showToast(`${overdueAlertCount} overdue ${overdueAlertCount === 1 ? "book" : "books"} detected`, "error")
          : showToast("No overdue books right now", "success")
      }
    >
      <Ic n="bell" s={16} c="currentColor" />
      {overdueAlertCount > 0 && <div style={{ position:"absolute", top:3, right:3, width:6, height:6, borderRadius:"50%", background:"var(--red)" }} />}
    </button>
    <button className="btn-ghost" style={{ padding:"5px 10px" }} onClick={onGoFront}>
      <Ic n="logout" s={13} c="currentColor" /> &nbsp; FRONT PAGE
    </button>
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 12px", border:"1px solid var(--border2)", background:"var(--surface)" }}>
      <div style={{ width:22, height:22, border:"1px solid var(--green)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <span className="mono" style={{ fontSize:10, color:"var(--green)" }}>A</span>
      </div>
      <span className="mono" style={{ fontSize:10, letterSpacing:".08em", color:"var(--white)" }}>ADMIN</span>
      <span className="dot dot-green" />
    </div>
  </header>
);

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════ */
const DashboardPage = ({ stats, transactions, loading }) => {
  const [bars, setBars] = useState(false);
  useEffect(() => { setTimeout(() => setBars(true), 400); }, []);
  const months = [45,62,38,71,55,48,63,77,42,58,69,84];
  const overdueCount = transactions.filter(t=>t.status==="OVERDUE").length;

const STATS = [
  {
    label: "Total Books",
    value: loading ? "—" : (stats.totalBooks || 0).toLocaleString(),
    icon: "book",
    color: "var(--green)",
    sub: "48 new this month"
  },
  {
    label: "Active Members",
    value: loading ? "—" : (stats.activeMembers || 0),
    icon: "users",
    color: "var(--cyan)",
    sub: "18 pending renewal"
  },
  {
    label: "Books on Loan",
    value: loading ? "—" : (stats.onLoan || 0),
    icon: "swap",
    color: "var(--orange)",
    sub: "↑ 12% this week"
  },
  {
    label: "Pending Fines",
    value: loading
      ? "—"
      : `₹${(stats.pendingFines || 0).toLocaleString()}`,
    icon: "alert",
    color: "var(--red)",
    sub: `From ${stats.overdueCount || 0} members`
  },
];

  return (
    <div className="scroll-y" style={{ padding:28, flex:1 }}>
      {/* Oracle query hint */}
      <div className="mono fade-up" style={{ fontSize:9, color:"var(--muted)", marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ color:"var(--green)" }}>►</span>
        EXEC vw_dashboard_stats; &nbsp; {loading ? <span style={{ animation:"blink 1s infinite" }}>FETCHING...</span> : <span style={{ color:"var(--green)" }}>4 COLUMNS RETURNED</span>}
      </div>

      {/* Overdue banner */}
      {!loading && overdueCount > 0 && (
        <div className="fade-up" style={{ background:"rgba(255,56,96,.08)", border:"1px solid rgba(255,56,96,.3)", padding:"10px 16px", marginBottom:24, display:"flex", alignItems:"center", gap:10 }}>
          <Ic n="alert" s={14} c="var(--red)" />
          <span className="mono" style={{ fontSize:11, color:"var(--red)" }}>
            ⚠ &nbsp; {overdueCount} BOOKS CURRENTLY OVERDUE — FINES ACCUMULATING AT ₹2/DAY
          </span>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12, marginBottom:24 }}>
        {STATS.map((s,i) => (
          <div key={s.label} className={`stat-card fade-up`} style={{ animationDelay:`${i*.07}s` }}>
            {loading ? (
              <><div className="skeleton" style={{ height:14, width:"50%", marginBottom:12 }} /><div className="skeleton" style={{ height:32, width:"70%", marginBottom:8 }} /><div className="skeleton" style={{ height:10, width:"60%" }} /></>
            ) : (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <span className="mono" style={{ fontSize:8, letterSpacing:".18em", color:"var(--muted2)" }}>{s.label}</span>
                  <Ic n={s.icon} s={16} c={s.color} />
                </div>
                <div className="display" style={{ fontSize:"clamp(24px,3vw,36px)", fontWeight:900, color:s.color, lineHeight:1, textShadow:`0 0 20px ${s.color}40` }}>{s.value}</div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", marginTop:10 }}>{s.sub}</div>
              </>
            )}
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:16, marginBottom:16 }}>
        {/* Bar chart */}
        <div className="neon-card fade-up" style={{ animationDelay:".28s", padding:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div>
              <div className="sect-label" style={{ marginBottom:4 }}>MONTHLY CIRCULATION</div>
              <div className="display" style={{ fontSize:16, fontWeight:700, color:"var(--white)" }}>Issue / Return Trends</div>
            </div>
            <select className="cyber-input" style={{ width:100, height:30, fontSize:10 }}><option>2024</option></select>
          </div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:120 }}>
            {months.map((v,i) => (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                <div style={{ width:"100%", background:`linear-gradient(to top,var(--green),rgba(0,255,136,.3))`, borderRadius:"2px 2px 0 0", height:bars?`${(v/90)*100}%`:"4px", transition:`height .7s cubic-bezier(.22,.68,0,1.2) ${i*.04}s`, cursor:"pointer", position:"relative" }} title={`${v} books`} />
                <span className="mono" style={{ fontSize:8, color:"var(--muted)" }}>{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="neon-card fade-up" style={{ animationDelay:".36s", padding:20 }}>
          <div className="sect-label" style={{ marginBottom:8 }}>RECENT ACTIVITY</div>
          <div className="display" style={{ fontSize:14, fontWeight:700, color:"var(--white)", marginBottom:16 }}>Live Transactions</div>
          {loading
            ? [...Array(5)].map((_,i) => <div key={i} className="skeleton" style={{ height:44, marginBottom:8 }} />)
            : transactions.slice(0,5).map(t => (
              <div key={t.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:"1px solid var(--border2)" }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color:"var(--white)", marginBottom:3 }}>{t.bookTitle.slice(0,22)}{t.bookTitle.length>22?"…":""}</div>
                  <div className="mono" style={{ fontSize:9, color:"var(--muted2)" }}>{t.member}</div>
                </div>
                <span className={`tag tag-${t.status==="OVERDUE"?"red":t.status==="RETURNED"?"green":"cyan"}`}>{t.status}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Category bars */}
      <div className="neon-card fade-up" style={{ animationDelay:".44s", padding:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div><div className="sect-label" style={{ marginBottom:4 }}>COLLECTION ANALYTICS</div>
          <div className="display" style={{ fontSize:16, fontWeight:700, color:"var(--white)" }}>Books by Category</div></div>
          <div className="mono" style={{ fontSize:9, color:"var(--muted)" }}>SELECT category, COUNT(*) FROM lms_books GROUP BY category</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16 }}>
          {[["Fiction",340,27],["Technology",280,22],["History",210,17],["Science",175,14],["Arts",130,10],["Biography",105,8]].map(([cat,cnt,pct],i) => (
            <div key={cat} className="fade-up" style={{ animationDelay:`${.5+i*.05}s` }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span className="mono" style={{ fontSize:10, color:"var(--text)" }}>{cat}</span>
                <span className="mono" style={{ fontSize:10, color:"var(--green)" }}>{cnt}</span>
              </div>
              <div className="prog"><div className="prog-fill" style={{ width:bars?`${pct}%`:"0%" }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   BOOKS PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
const CATS = ["Fiction","Dystopian","Classic","Technology","History","Arts","Science","Biography"];
const BooksPage = ({ books, setBooks, loading, showToast }) => {
  const [search, setSearch] = useState("");
  const [cat, setCat]       = useState("All");
  const [modal, setModal]   = useState(false);
  const [editB, setEditB]   = useState(null);
  const [form, setForm]     = useState({ title:"", author:"", isbn:"", category:"Fiction", year:"", copies:"", shelf:"" });

  const filtered = books.filter(b =>
    (cat==="All"||b.category===cat) &&
    (b.title.toLowerCase().includes(search.toLowerCase())||b.author.toLowerCase().includes(search.toLowerCase())||b.isbn.includes(search))
  );

  const openAdd  = () => { setEditB(null); setForm({ title:"",author:"",isbn:"",category:"Fiction",year:"",copies:"",shelf:"" }); setModal(true); };
  const openEdit = b  => { setEditB(b);   setForm({ title:b.title,author:b.author,isbn:b.isbn,category:b.category,year:String(b.year),copies:String(b.copies),shelf:b.shelf }); setModal(true); };
  const save     = () => {
    if (!form.title||!form.author) return;
    if (editB) {
      setBooks(bs => bs.map(b => b.id===editB.id ? { ...b,...form,year:+form.year,copies:+form.copies,available:+form.copies } : b));
      showToast("UPDATE lms_books SET ... — 1 ROW UPDATED", "success");
    } else {
      const nb = { id:`B${String(books.length+1).padStart(3,"0")}`, ...form, year:+form.year, copies:+form.copies, available:+form.copies, rating:4.0, status:"AVAILABLE" };
      setBooks(bs => [...bs, nb]);
      showToast("INSERT INTO lms_books ... — 1 ROW INSERTED", "success");
    }
    setModal(false);
  };
  const del = id => { setBooks(bs=>bs.filter(b=>b.id!==id)); showToast("DELETE FROM lms_books WHERE book_id=? — 1 ROW DELETED","success"); };

  const statusColor = { AVAILABLE:"green", LOW_STOCK:"yellow", OUT_OF_STOCK:"red" };

  return (
    <div className="scroll-y" style={{ padding:28, flex:1 }}>
      {/* Oracle hint */}
      <div className="mono fade-up" style={{ fontSize:9, color:"var(--muted)", marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ color:"var(--green)" }}>►</span>
        EXEC sp_get_books; &nbsp; <span style={{ color:"var(--green)" }}>{loading?"FETCHING...":filtered.length+" ROWS RETURNED"}</span>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <div className="sect-label">BOOK CATALOGUE</div>
          <div className="display" style={{ fontSize:20, fontWeight:700, color:"var(--white)" }}>LMS BOOKS</div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn-ghost">EXPORT CSV</button>
          <button className="btn-neon" onClick={openAdd}><span><Ic n="plus" s={12} c="currentColor" /> &nbsp; ADD BOOK</span></button>
        </div>
      </div>

      {/* Filters */}
      <div className="fade-up" style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", animationDelay:".08s" }}>
        <div style={{ position:"relative", flex:1, minWidth:220 }}>
          <Ic n="search" s={12} c="var(--muted2)" />
          <input className="cyber-input" placeholder="WHERE title LIKE '%...%'" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:28 }} />
        </div>
        <select className="cyber-input" style={{ width:160 }} value={cat} onChange={e=>setCat(e.target.value)}>
          <option value="All">ALL CATEGORIES</option>
          {CATS.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="neon-card fade-up" style={{ animationDelay:".14s", padding:0, overflow:"hidden" }}>
        <table className="cyber-table">
          <thead><tr>
            <th>BOOK_ID</th><th>TITLE / AUTHOR</th><th>CATEGORY</th><th>ISBN</th>
            <th>COPIES</th><th>AVAILABLE</th><th>SHELF</th><th>RATING</th><th>STATUS</th><th>ACTION</th>
          </tr></thead>
          <tbody>
            {loading
              ? [...Array(6)].map((_,i) => (
                  <tr key={i}>{[...Array(10)].map((_,j) => <td key={j}><div className="skeleton" style={{ height:14, width:"80%" }} /></td>)}</tr>
                ))
              : filtered.map((b,i) => (
                <tr key={b.id} style={{ animationDelay:`${i*.04}s` }}>
                  <td><span className="mono" style={{ fontSize:10, color:"var(--muted2)" }}>{b.id}</span></td>
                  <td><div style={{ fontWeight:600, color:"var(--white)", fontSize:13 }}>{b.title}</div><div className="mono" style={{ fontSize:9, color:"var(--muted2)", marginTop:3 }}>{b.author} · {b.year}</div></td>
                  <td><span className="tag tag-green">{b.category}</span></td>
                  <td><span className="mono" style={{ fontSize:10 }}>{b.isbn}</span></td>
                  <td className="mono" style={{ textAlign:"center", fontSize:12 }}>{b.copies}</td>
                  <td style={{ textAlign:"center" }}><span className={`tag tag-${b.available===0?"red":b.available<=1?"yellow":"green"}`}>{b.available}</span></td>
                  <td><span className="mono" style={{ fontSize:11 }}>{b.shelf}</span></td>
                  <td><div style={{ display:"flex", alignItems:"center", gap:4 }}><Ic n="star" s={11} c="var(--yellow)" /><span className="mono" style={{ fontSize:11 }}>{b.rating}</span></div></td>
                  <td><span className={`tag tag-${statusColor[b.status]||"muted"}`}>{b.status}</span></td>
                  <td><div style={{ display:"flex", gap:6 }}>
                    <button className="btn-ghost" style={{ padding:"4px 8px" }} onClick={() => openEdit(b)}><Ic n="edit" s={12} c="currentColor" /></button>
                    <button className="btn-danger" style={{ padding:"4px 8px" }} onClick={() => del(b.id)}><Ic n="trash" s={12} c="currentColor" /></button>
                  </div></td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {!loading && filtered.length===0 && <div className="mono" style={{ padding:40, textAlign:"center", color:"var(--muted2)", fontSize:12 }}>NO ROWS RETURNED</div>}
      </div>

      {modal && (
        <Modal title={editB?"UPDATE RECORD":"INSERT RECORD"} sqlHint={editB?"UPDATE lms_books SET ...":"INSERT INTO lms_books"} onClose={() => setModal(false)}>
          <div style={{ display:"grid", gap:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div><label className="cyber-label">TITLE *</label><input className="cyber-input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="book_title" /></div>
              <div><label className="cyber-label">AUTHOR *</label><input className="cyber-input" value={form.author} onChange={e=>setForm(f=>({...f,author:e.target.value}))} placeholder="full_name" /></div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div><label className="cyber-label">ISBN</label><input className="cyber-input" value={form.isbn} onChange={e=>setForm(f=>({...f,isbn:e.target.value}))} placeholder="978-x-xxx-xxxxx-x" /></div>
              <div><label className="cyber-label">CATEGORY</label>
                <select className="cyber-input" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              <div><label className="cyber-label">PUB_YEAR</label><input className="cyber-input" type="number" value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))} placeholder="2024" /></div>
              <div><label className="cyber-label">COPIES</label><input className="cyber-input" type="number" value={form.copies} onChange={e=>setForm(f=>({...f,copies:e.target.value}))} placeholder="1" /></div>
              <div><label className="cyber-label">SHELF_LOC</label><input className="cyber-input" value={form.shelf} onChange={e=>setForm(f=>({...f,shelf:e.target.value}))} placeholder="A-01" /></div>
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:6 }}>
              <button className="btn-ghost" onClick={() => setModal(false)}>CANCEL</button>
              <button className="btn-neon" onClick={save}><span><Ic n="check" s={12} c="currentColor" /> &nbsp; {editB?"UPDATE":"INSERT"}</span></button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MEMBERS PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
const MembersPage = ({ members, setMembers, loading, showToast, refreshMembers }) => {
  const [search, setSearch] = useState("");
  const [modal, setModal]   = useState(false);
  const [editM, setEditM]   = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [form, setForm]     = useState({ name:"", email:"", phone:"", type:"STANDARD" });

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())||m.email.includes(search)||m.id.includes(search)
  );

  const openAdd = () => {
    setEditM(null);
    setForm({ name:"", email:"", phone:"", type:"STANDARD" });
    setModal(true);
  };

  const openEdit = (member) => {
    setEditM(member);
    setForm({ name: member.name, email: member.email, phone: member.phone || "", type: member.type || "STANDARD" });
    setModal(true);
  };

  const addOrUpdateMember = async () => {
    if (!form.name || !form.email) {
      showToast("FULL_NAME and EMAIL are required", "error");
      return;
    }

    setSaving(true);
    try {
      if (editM) {
        await API.updateMember(editM.id, {
          fullName: form.name,
          email: form.email,
          phone: form.phone,
          type: form.type,
        });
        showToast("UPDATE lms_members ... — 1 ROW UPDATED", "success");
      } else {
        await API.addMember({
          fullName: form.name,
          email: form.email,
          phone: form.phone,
          type: form.type,
        });
        showToast("INSERT INTO lms_members ... — 1 ROW INSERTED","success");
      }
      await refreshMembers?.();
      setLastSync(new Date());
      setModal(false);
    } catch (e) {
      showToast(e.message || "Member operation failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = id => {
    setMembers(ms => ms.map(m => m.id===id ? {...m, status:m.status==="ACTIVE"?"SUSPENDED":"ACTIVE"} : m));
    showToast("UPDATE lms_members SET status=? — 1 ROW UPDATED","success");
  };

  const typeTag = { PREMIUM:"cyan", STANDARD:"green", STUDENT:"yellow" };

  return (
    <div className="scroll-y" style={{ padding:28, flex:1 }}>
      <div className="mono fade-up" style={{ fontSize:9, color:"var(--muted)", marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ color:"var(--green)" }}>►</span>
        EXEC sp_get_members; &nbsp; <span style={{ color:"var(--green)" }}>{loading?"FETCHING...":filtered.length+" ROWS RETURNED"}</span>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div><div className="sect-label">MEMBER REGISTRY</div><div className="display" style={{ fontSize:20, fontWeight:700, color:"var(--white)" }}>LMS MEMBERS</div></div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn-ghost" onClick={async () => { await refreshMembers?.(); setLastSync(new Date()); }}>
            <Ic n="refresh" s={12} c="currentColor" /> &nbsp; REFRESH
          </button>
          <button className="btn-neon" onClick={openAdd}><span><Ic n="plus" s={12} c="currentColor" /> &nbsp; REGISTER MEMBER</span></button>
        </div>
      </div>
      {lastSync && (
        <div className="mono" style={{ fontSize:9, color:"var(--muted2)", marginBottom:10 }}>
          LAST SYNC: {lastSync.toLocaleTimeString()}
        </div>
      )}

      <div style={{ position:"relative", marginBottom:18 }}>
        <Ic n="search" s={12} c="var(--muted2)" />
        <input className="cyber-input" style={{ maxWidth:400, paddingLeft:28 }} placeholder="WHERE full_name LIKE '%...%'" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
        {loading
          ? [...Array(6)].map((_,i) => <div key={i} className="neon-card" style={{ padding:24, height:220 }}><div className="skeleton" style={{ height:"100%", opacity:.5 }} /></div>)
          : filtered.map((m,i) => (
            <div key={m.id} className="neon-card fade-up" style={{ padding:22, animationDelay:`${i*.06}s` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  <div style={{ width:40, height:40, border:"1px solid var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span className="display" style={{ fontSize:14, fontWeight:700, color:"var(--green)" }}>{m.name[0]}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight:600, color:"var(--white)", fontSize:14 }}>{m.name}</div>
                    <div className="mono" style={{ fontSize:9, color:"var(--muted2)" }}>{m.id}</div>
                  </div>
                </div>
                <span className={`tag tag-${m.status==="ACTIVE"?"green":"red"}`}>{m.status}</span>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
                {[["EMAIL",m.email],["PHONE",m.phone],["JOINED",m.joined],["EXPIRY",m.expiry]].map(([k,v]) => (
                  <div key={k}><div className="mono" style={{ fontSize:8, color:"var(--muted)", letterSpacing:".1em" }}>{k}</div><div style={{ fontSize:11, color:"var(--text)", marginTop:2 }}>{v}</div></div>
                ))}
              </div>

              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
                <span className={`tag tag-${typeTag[m.type]||"muted"}`}>{m.type}</span>
                <span className="tag tag-cyan">{m.issued} ISSUED</span>
                {m.fines>0 && <span className="tag tag-red">₹{m.fines} FINES</span>}
              </div>

              <div style={{ display:"flex", gap:8 }}>
                <button className="btn-ghost" style={{ flex:1, justifyContent:"center", fontSize:9 }} onClick={() => toggleStatus(m.id)}>
                  <Ic n="shield" s={11} c="currentColor" /> &nbsp; {m.status==="ACTIVE"?"SUSPEND":"ACTIVATE"}
                </button>
                <button className="btn-ghost" style={{ padding:"7px 10px" }} onClick={() => openEdit(m)}><Ic n="edit" s={12} c="currentColor" /></button>
              </div>
            </div>
          ))
        }
      </div>

      {modal && (
        <Modal title={editM ? "UPDATE MEMBER" : "INSERT NEW MEMBER"} sqlHint={editM ? "UPDATE lms_members" : "INSERT INTO lms_members"} onClose={() => setModal(false)}>
          <div style={{ display:"grid", gap:14 }}>
            <div><label className="cyber-label">FULL_NAME *</label><input className="cyber-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="member_full_name" /></div>
            <div><label className="cyber-label">EMAIL *</label><input className="cyber-input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@domain.com" /></div>
            <div><label className="cyber-label">PHONE</label><input className="cyber-input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="10-digit" /></div>
            <div><label className="cyber-label">MEMBERSHIP_TYPE</label>
              <select className="cyber-input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                <option>STUDENT</option><option>STANDARD</option><option>PREMIUM</option>
              </select>
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:6 }}>
              <button className="btn-ghost" onClick={() => setModal(false)}>CANCEL</button>
              <button className="btn-neon" onClick={addOrUpdateMember} disabled={saving}>
                <span><Ic n={saving ? "refresh" : "check"} s={12} c="currentColor" /> &nbsp; {saving ? "PROCESSING..." : "COMMIT"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   ISSUE / RETURN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
const IssuePage = ({ books, members, transactions, setTransactions, loading, showToast }) => {
  const [tab, setTab]       = useState("active");
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ memberId:"", bookId:"" });
  const [processing, setProcessing] = useState(null);

  const active   = transactions.filter(t => t.status!=="RETURNED");
  const returned = transactions.filter(t => t.status==="RETURNED");
  const list     = tab==="active" ? active : returned;

  const issueBook = async () => {
    if (!form.memberId||!form.bookId) return;
    const book   = books.find(b=>b.id===form.bookId);
    const member = members.find(m=>m.id===form.memberId);
    if (!book||!member) { showToast("MEMBER_ID or BOOK_ID not found","error"); return; }
    try {
      const res = await API.issueBook(form.memberId, form.bookId);
      const today = new Date().toISOString().split("T")[0];
      const nt = { id:res.txnId, bookId:book.id, bookTitle:book.title, memberId:member.id, member:member.name, issueDate:today, dueDate:res.dueDate, returnDate:null, fine:0, status:"ISSUED" };
      setTransactions(ts => [...ts, nt]);
      showToast(`sp_issue_book — TXN ${res.txnId} COMMITTED`,"success");
      setModal(false);
    } catch (e) {
      showToast(e.message || "Issue book failed", "error");
    }
  };

  const returnBook = async id => {
    setProcessing(id);
    try {
      const res = await API.returnBook(id);
      setTransactions(ts => ts.map(t => t.id===id ? {...t, status:"RETURNED", returnDate:new Date().toISOString().split("T")[0], fine:Number(res.fine||0)} : t));
      showToast(`sp_return_book(${id}) — FINE: ₹${res.fine} — COMMITTED`,"success");
    } catch (e) {
      showToast(e.message || "Return book failed", "error");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="scroll-y" style={{ padding:28, flex:1 }}>
      <div className="mono fade-up" style={{ fontSize:9, color:"var(--muted)", marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ color:"var(--green)" }}>►</span>
        SELECT * FROM vw_active_transactions; &nbsp; <span style={{ color:"var(--green)" }}>{loading?"FETCHING...":list.length+" ROWS"}</span>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div><div className="sect-label">TRANSACTION MANAGEMENT</div><div className="display" style={{ fontSize:20, fontWeight:700, color:"var(--white)" }}>LMS TRANSACTIONS</div></div>
        <button className="btn-neon" onClick={() => { setForm({memberId:"",bookId:""}); setModal(true); }}><span><Ic n="plus" s={12} c="currentColor" /> &nbsp; ISSUE BOOK</span></button>
      </div>

      {/* Tabs */}
      <div className="fade-up" style={{ display:"flex", gap:2, marginBottom:18, animationDelay:".08s" }}>
        {[["active","ACTIVE / OVERDUE"],["returned","RETURNED"]].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)} className={tab===v?"btn-neon":"btn-ghost"} style={{ borderRadius:0, clipPath:"none" }}>
            {tab===v ? <span>{l}</span> : l}
          </button>
        ))}
      </div>

      <div className="neon-card fade-up" style={{ animationDelay:".14s", padding:0, overflow:"hidden" }}>
        <table className="cyber-table">
          <thead><tr>
            <th>TXN_ID</th><th>BOOK</th><th>MEMBER</th><th>ISSUE_DATE</th><th>DUE_DATE</th>
            {tab==="returned"&&<th>RETURN_DATE</th>}
            <th>FINE_CALC</th><th>STATUS</th><th>ACTION</th>
          </tr></thead>
          <tbody>
            {loading
              ? [...Array(5)].map((_,i) => <tr key={i}>{[...Array(9)].map((_,j) => <td key={j}><div className="skeleton" style={{ height:12,width:"80%" }} /></td>)}</tr>)
              : list.map((t,i) => (
                <tr key={t.id} style={{ animationDelay:`${i*.04}s` }}>
                  <td><span className="mono" style={{ fontSize:9, color:"var(--muted2)" }}>{t.id}</span></td>
                  <td><div style={{ fontSize:12, fontWeight:600, color:"var(--white)" }}>{t.bookTitle}</div><span className="mono" style={{ fontSize:9, color:"var(--muted2)" }}>{t.bookId}</span></td>
                  <td><div style={{ fontSize:12 }}>{t.member}</div><span className="mono" style={{ fontSize:9, color:"var(--muted2)" }}>{t.memberId}</span></td>
                  <td className="mono" style={{ fontSize:11 }}>{t.issueDate}</td>
                  <td className="mono" style={{ fontSize:11, color:t.status==="OVERDUE"?"var(--red)":"var(--text)" }}>{t.dueDate}</td>
                  {tab==="returned"&&<td className="mono" style={{ fontSize:11 }}>{t.returnDate||"—"}</td>}
                  <td>{t.fine>0 ? <span className="tag tag-red">₹{t.fine}</span> : <span className="mono" style={{ fontSize:10, color:"var(--muted)" }}>NULL</span>}</td>
                  <td><span className={`tag tag-${t.status==="OVERDUE"?"red":t.status==="RETURNED"?"green":"cyan"}`}>{t.status}</span></td>
                  <td>{t.status!=="RETURNED" && (
                    <button className="btn-ghost" style={{ fontSize:9, padding:"5px 10px" }} onClick={() => returnBook(t.id)} disabled={processing===t.id}>
                      {processing===t.id ? <span className="spin"><Ic n="refresh" s={11} c="currentColor" /></span> : <><Ic n="refresh" s={11} c="currentColor" /> RETURN</>}
                    </button>
                  )}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="CALL sp_issue_book(:member_id, :book_id)" sqlHint="EXECUTE STORED PROCEDURE" onClose={() => setModal(false)}>
          <div style={{ display:"grid", gap:14 }}>
            <div>
              <label className="cyber-label">MEMBER_ID (p_member_id)</label>
              <select className="cyber-input" value={form.memberId} onChange={e=>setForm(f=>({...f,memberId:e.target.value}))}>
                <option value="">-- SELECT MEMBER --</option>
                {members.filter(m => String(m.status || "").toUpperCase() === "ACTIVE").map(m=><option key={m.id} value={m.id}>{m.id} — {m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="cyber-label">BOOK_ID (p_book_id)</label>
              <select className="cyber-input" value={form.bookId} onChange={e=>setForm(f=>({...f,bookId:e.target.value}))}>
                <option value="">-- SELECT BOOK --</option>
                {books.filter(b=>b.available>0).map(b=><option key={b.id} value={b.id}>{b.id} — {b.title} (AVAIL: {b.available})</option>)}
              </select>
            </div>
            <div className="sql-panel" style={{ fontSize:10 }}>
              <span className="sql-cm">-- Auto-populated parameters</span>{"\n"}
              p_loan_period &nbsp;:= <span className="sql-num">14</span>; <span className="sql-cm">-- days</span>{"\n"}
              p_fine_rate &nbsp;&nbsp;&nbsp;:= <span className="sql-num">2</span>;  <span className="sql-cm">-- ₹/day overdue</span>
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button className="btn-ghost" onClick={() => setModal(false)}>ROLLBACK</button>
              <button className="btn-neon" onClick={issueBook}><span><Ic n="check" s={12} c="currentColor" /> &nbsp; COMMIT</span></button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   FINES PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
const FinesPage = ({ transactions, loading, showToast }) => {
  const [dbFines, setDbFines] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);

  const now = new Date();
  const overdue = transactions.filter(t => {
    if (String(t.status || "").toUpperCase() === "RETURNED") return false;
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < now;
  });
  const computedFine = (t) => {
    const days = Math.max(0, Math.floor((Date.now() - new Date(t.dueDate)) / 86400000));
    return Number(t.fine || 0) > 0 ? Number(t.fine) : days * 2;
  };
  const total = overdue.reduce((s, t) => s + computedFine(t), 0);

  const loadDbFines = useCallback(async () => {
    setDbLoading(true);
    try {
      const rows = await API.getFines();
      setDbFines(rows || []);
    } catch (e) {
      showToast(e.message || "Failed to fetch lms_fines rows", "error");
    } finally {
      setDbLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDbFines();
  }, [loadDbFines]);

  return (
    <div className="scroll-y" style={{ padding:28, flex:1 }}>
      <div className="mono fade-up" style={{ fontSize:9, color:"var(--muted)", marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ color:"var(--green)" }}>►</span>
        SELECT * FROM lms_fines WHERE paid_flag='N'; &nbsp; <span style={{ color:"var(--red)" }}>{overdue.length} OVERDUE RECORDS</span>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div><div className="sect-label">FINE MANAGEMENT — trg_auto_fine</div><div className="display" style={{ fontSize:20, fontWeight:700, color:"var(--white)" }}>LMS FINES</div></div>
        <button className="btn-ghost" onClick={() => showToast("EXEC sp_send_fine_reminders — EMAILS QUEUED","success")}>
          <Ic n="bell" s={13} c="currentColor" /> &nbsp; SEND REMINDERS
        </button>
      </div>

      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
        {[["TOTAL PENDING",`₹${total}`,"red"],["MEMBERS AFFECTED",new Set(overdue.map(t=>t.memberId)).size,"orange"],["OVERDUE COUNT",overdue.length,"yellow"]].map(([l,v,c]) => (
          <div key={l} className="stat-card fade-up">
            <div className="mono" style={{ fontSize:8, letterSpacing:".18em", color:"var(--muted2)", marginBottom:10 }}>{l}</div>
            <div className="display" style={{ fontSize:"clamp(22px,4vw,40px)", fontWeight:900, color:`var(--${c})`, textShadow:`0 0 20px rgba(255,255,255,.1)` }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="neon-card fade-up" style={{ animationDelay:".24s", padding:0, overflow:"hidden" }}>
        <table className="cyber-table">
          <thead><tr><th>BOOK</th><th>MEMBER</th><th>DUE_DATE</th><th>DAYS_OVERDUE</th><th>FINE_AMOUNT</th><th>ACTION</th></tr></thead>
          <tbody>
            {loading
              ? [...Array(3)].map((_,i) => <tr key={i}>{[...Array(6)].map((_,j) => <td key={j}><div className="skeleton" style={{ height:12,width:"80%" }} /></td>)}</tr>)
              : overdue.map((t,i) => {
                  const days = Math.max(0, Math.floor((Date.now()-new Date(t.dueDate))/86400000));
                  return (
                    <tr key={t.id} style={{ animationDelay:`${i*.05}s` }}>
                      <td><div style={{ fontSize:13, fontWeight:600, color:"var(--white)" }}>{t.bookTitle}</div><span className="mono" style={{ fontSize:9, color:"var(--muted2)" }}>{t.bookId}</span></td>
                      <td style={{ fontSize:13 }}>{t.member}</td>
                      <td className="mono" style={{ fontSize:11, color:"var(--red)" }}>{t.dueDate}</td>
                      <td><span className="tag tag-red">{days} DAYS</span></td>
                      <td><span className="display" style={{ fontSize:22, fontWeight:900, color:"var(--red)", textShadow:"0 0 12px rgba(255,56,96,.4)" }}>₹{computedFine(t)}</span></td>
                      <td><button className="btn-neon" style={{ fontSize:10, padding:"7px 16px" }} onClick={() => showToast(`UPDATE lms_fines SET paid_flag='Y' WHERE txn_id='${t.id}' — COMMITTED`,"success")}><span><Ic n="check" s={11} c="currentColor" /> COLLECT</span></button></td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
        {!loading&&overdue.length===0&&<div className="mono" style={{ padding:40, textAlign:"center", color:"var(--green)", fontSize:12 }}>✓ NO OUTSTANDING FINES — ALL CLEAR</div>}
      </div>

      <div className="neon-card fade-up" style={{ marginTop:18, padding:0, overflow:"hidden" }}>
        <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--border2)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div className="sect-label" style={{ marginBottom:4 }}>CROSS VERIFY</div>
            <div className="display" style={{ fontSize:14, color:"var(--white)", fontWeight:700 }}>Actual `lms_fines` Records</div>
          </div>
          <button className="btn-ghost" onClick={loadDbFines} disabled={dbLoading}>
            <Ic n="refresh" s={11} c="currentColor" /> &nbsp; {dbLoading ? "REFRESHING..." : "REFRESH"}
          </button>
        </div>
        <table className="cyber-table">
          <thead>
            <tr><th>FINE_ID</th><th>TXN_ID</th><th>MEMBER</th><th>BOOK</th><th>AMOUNT</th><th>CREATED</th></tr>
          </thead>
          <tbody>
            {dbLoading
              ? [...Array(2)].map((_,i) => <tr key={i}>{[...Array(6)].map((__,j) => <td key={j}><div className="skeleton" style={{ height:12, width:"75%" }} /></td>)}</tr>)
              : dbFines.map((f) => (
                <tr key={f.fine_id}>
                  <td className="mono" style={{ fontSize:10 }}>{f.fine_id}</td>
                  <td className="mono" style={{ fontSize:10 }}>{f.txn_id}</td>
                  <td>{f.member}</td>
                  <td>{f.book_title}</td>
                  <td><span className="tag tag-red">₹{f.amount}</span></td>
                  <td className="mono" style={{ fontSize:10 }}>{f.created_date}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {!dbLoading && dbFines.length === 0 && (
          <div className="mono" style={{ padding:22, color:"var(--muted2)", fontSize:11, textAlign:"center" }}>
            No unpaid rows found in `lms_fines`.
          </div>
        )}
      </div>

      {/* Trigger code */}
      <div className="fade-up" style={{ marginTop:24 }}>
        <div className="sect-label" style={{ marginBottom:12 }}>ORACLE TRIGGER — AUTO FINE CALCULATION</div>
        <SqlBox code={`<span class="sql-kw">CREATE OR REPLACE TRIGGER</span> <span class="sql-tb">trg_auto_fine</span>\n<span class="sql-kw">BEFORE UPDATE OF</span> return_date <span class="sql-kw">ON</span> <span class="sql-tb">lms_transactions</span>\n<span class="sql-kw">FOR EACH ROW</span>\n<span class="sql-kw">DECLARE</span>\n  v_overdue_days <span class="sql-fn">NUMBER</span>;\n  v_rate         <span class="sql-fn">NUMBER</span> := <span class="sql-num">2</span>; <span class="sql-cm">-- ₹2 per day</span>\n<span class="sql-kw">BEGIN</span>\n  <span class="sql-kw">IF</span> :NEW.return_date > :OLD.due_date <span class="sql-kw">THEN</span>\n    v_overdue_days := :NEW.return_date - :OLD.due_date;\n    :NEW.fine_amount := v_overdue_days * v_rate;\n    <span class="sql-cm">-- Also insert into lms_fines</span>\n    <span class="sql-kw">INSERT INTO</span> <span class="sql-tb">lms_fines</span>(txn_id,member_id,amount,paid_flag,created_dt)\n    <span class="sql-kw">VALUES</span>(:NEW.txn_id,:NEW.member_id,:NEW.fine_amount,<span class="sql-str">'N'</span>,<span class="sql-fn">SYSDATE</span>);\n  <span class="sql-kw">ELSE</span>\n    :NEW.fine_amount := <span class="sql-num">0</span>;\n  <span class="sql-kw">END IF</span>;\n<span class="sql-kw">END</span> trg_auto_fine;\n/`} />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   REPORTS PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
const ReportsPage = ({ books, transactions, loading }) => {
  const top5 = [...books].sort((a,b) => (b.copies-b.available)-(a.copies-a.available)).slice(0,5);
  return (
    <div className="scroll-y" style={{ padding:28, flex:1 }}>
      <div className="mono fade-up" style={{ fontSize:9, color:"var(--muted)", marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ color:"var(--green)" }}>►</span>
        SELECT * FROM vw_dashboard_stats; &nbsp; <span style={{ color:"var(--green)" }}>ANALYTICS VIEW</span>
      </div>
      <div><div className="sect-label">REPORTS & ANALYTICS</div><div className="display" style={{ fontSize:20, fontWeight:700, color:"var(--white)", marginBottom:24 }}>STATISTICS</div></div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14, marginBottom:24 }}>
        {[["Books Issued This Month",87,"+12%","green"],["New Registrations",23,"+5%","cyan"],["Fines Collected","₹3.2K","+18%","orange"],["On-Time Return Rate","76%","-3%","yellow"]].map(([l,v,c,col],i) => (
          <div key={l} className={`stat-card fade-up`} style={{ animationDelay:`${i*.07}s`, textAlign:"center" }}>
            <div className="mono" style={{ fontSize:8, letterSpacing:".12em", color:"var(--muted2)", marginBottom:12 }}>{l}</div>
            <div className="display" style={{ fontSize:"clamp(22px,3vw,36px)", fontWeight:900, color:`var(--${col})` }}>{v}</div>
            <div className="mono" style={{ fontSize:9, marginTop:10, color:c.startsWith("+")?`var(--green)`:"var(--red)" }}>{c} FROM LAST MONTH</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div className="neon-card fade-up" style={{ animationDelay:".32s", padding:24 }}>
          <div className="sect-label" style={{ marginBottom:8 }}>TOP BORROWED</div>
          <div className="display" style={{ fontSize:15, fontWeight:700, color:"var(--white)", marginBottom:20 }}>Most Circulated Books</div>
          {loading
            ? [...Array(5)].map((_,i) => <div key={i} className="skeleton" style={{ height:40, marginBottom:10 }} />)
            : top5.map((b,i) => (
              <div key={b.id} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                <span className="display" style={{ fontSize:24, fontWeight:900, color:"var(--surface)", WebkitTextStroke:"1px var(--border)", minWidth:32 }}>0{i+1}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"var(--white)", marginBottom:4 }}>{b.title}</div>
                  <div className="prog"><div className="prog-fill" style={{ width:`${70-i*12}%` }} /></div>
                </div>
                <span className="mono" style={{ fontSize:10, color:"var(--green)" }}>{40-i*7}×</span>
              </div>
            ))
          }
        </div>

        <div className="neon-card fade-up" style={{ animationDelay:".4s", padding:24 }}>
          <div className="sect-label" style={{ marginBottom:8 }}>ORACLE VIEW DDL</div>
          <div className="display" style={{ fontSize:15, fontWeight:700, color:"var(--white)", marginBottom:16 }}>vw_dashboard_stats</div>
          <SqlBox code={`<span class="sql-kw">CREATE OR REPLACE VIEW</span> <span class="sql-tb">vw_dashboard_stats</span> <span class="sql-kw">AS</span>\n<span class="sql-kw">SELECT</span>\n  (<span class="sql-kw">SELECT</span> <span class="sql-fn">COUNT</span>(*) <span class="sql-kw">FROM</span> <span class="sql-tb">lms_books</span>)                        total_books,\n  (<span class="sql-kw">SELECT</span> <span class="sql-fn">COUNT</span>(*) <span class="sql-kw">FROM</span> <span class="sql-tb">lms_members</span>\n   <span class="sql-kw">WHERE</span>  account_status = <span class="sql-str">'ACTIVE'</span>)            active_members,\n  (<span class="sql-kw">SELECT</span> <span class="sql-fn">COUNT</span>(*) <span class="sql-kw">FROM</span> <span class="sql-tb">lms_transactions</span>\n   <span class="sql-kw">WHERE</span>  return_date <span class="sql-kw">IS NULL</span>)                 books_on_loan,\n  (<span class="sql-kw">SELECT</span> <span class="sql-fn">NVL</span>(<span class="sql-fn">SUM</span>(amount),<span class="sql-num">0</span>)\n   <span class="sql-kw">FROM</span>   <span class="sql-tb">lms_fines</span>\n   <span class="sql-kw">WHERE</span>  paid_flag = <span class="sql-str">'N'</span>)                    pending_fines\n<span class="sql-kw">FROM DUAL</span>;`} />
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   SQL CONSOLE
   ═══════════════════════════════════════════════════════════════════════════ */
const SNIPPETS = {
  select_books: {
    label:"SELECT BOOKS",
    code:`<span class="sql-cm">-- Retrieve all available books with author & category</span>\n<span class="sql-kw">SELECT</span> b.book_id, b.isbn, b.title,\n       a.full_name          <span class="sql-kw">AS</span> author,\n       c.category_name,\n       b.total_copies - <span class="sql-fn">COUNT</span>(t.txn_id) <span class="sql-kw">AS</span> available_copies\n<span class="sql-kw">FROM</span>   <span class="sql-tb">lms_books</span> b\n<span class="sql-kw">JOIN</span>   <span class="sql-tb">lms_authors</span> a     <span class="sql-kw">ON</span> b.author_id    = a.author_id\n<span class="sql-kw">JOIN</span>   <span class="sql-tb">lms_categories</span> c  <span class="sql-kw">ON</span> b.category_id  = c.category_id\n<span class="sql-kw">LEFT JOIN</span> <span class="sql-tb">lms_transactions</span> t\n       <span class="sql-kw">ON</span> b.book_id = t.book_id <span class="sql-kw">AND</span> t.return_date <span class="sql-kw">IS NULL</span>\n<span class="sql-kw">GROUP BY</span> b.book_id, b.isbn, b.title, a.full_name, c.category_name, b.total_copies\n<span class="sql-kw">HAVING</span>   b.total_copies - <span class="sql-fn">COUNT</span>(t.txn_id) > <span class="sql-num">0</span>\n<span class="sql-kw">ORDER BY</span> b.title <span class="sql-kw">ASC</span>;`,
  },
  select_members: {
    label:"SELECT MEMBERS",
    code:`<span class="sql-cm">-- Member accounts with outstanding fines (NVL)</span>\n<span class="sql-kw">SELECT</span> m.member_id, m.full_name, m.email,\n       mt.type_name        <span class="sql-kw">AS</span> membership_tier,\n       <span class="sql-fn">NVL</span>(<span class="sql-fn">SUM</span>(f.amount),<span class="sql-num">0</span>)  <span class="sql-kw">AS</span> total_fines,\n       m.account_status\n<span class="sql-kw">FROM</span>   <span class="sql-tb">lms_members</span> m\n<span class="sql-kw">JOIN</span>   <span class="sql-tb">lms_member_types</span> mt <span class="sql-kw">ON</span> m.type_id = mt.type_id\n<span class="sql-kw">LEFT JOIN</span> <span class="sql-tb">lms_fines</span> f\n       <span class="sql-kw">ON</span> m.member_id = f.member_id\n       <span class="sql-kw">AND</span> f.paid_flag = <span class="sql-str">'N'</span>\n<span class="sql-kw">GROUP BY</span> m.member_id, m.full_name, m.email,\n         mt.type_name, m.account_status\n<span class="sql-kw">ORDER BY</span> total_fines <span class="sql-kw">DESC</span>;`,
  },
  trigger: {
    label:"TRIGGER DDL",
    code:`<span class="sql-kw">CREATE OR REPLACE TRIGGER</span> <span class="sql-tb">trg_auto_fine</span>\n<span class="sql-kw">BEFORE UPDATE OF</span> return_date <span class="sql-kw">ON</span> <span class="sql-tb">lms_transactions</span>\n<span class="sql-kw">FOR EACH ROW</span>\n<span class="sql-kw">DECLARE</span>\n  v_days <span class="sql-fn">NUMBER</span>;\n<span class="sql-kw">BEGIN</span>\n  <span class="sql-kw">IF</span> :NEW.return_date > :OLD.due_date <span class="sql-kw">THEN</span>\n    v_days := :NEW.return_date - :OLD.due_date;\n    :NEW.fine_amount := v_days * <span class="sql-num">2</span>;\n    <span class="sql-kw">INSERT INTO</span> <span class="sql-tb">lms_fines</span> VALUES(<span class="sql-fn">seq_fine.NEXTVAL</span>,\n      :NEW.txn_id,:NEW.member_id,:NEW.fine_amount,<span class="sql-str">'N'</span>,<span class="sql-fn">SYSDATE</span>);\n  <span class="sql-kw">END IF</span>;\n<span class="sql-kw">END</span>;\n/\n\n<span class="sql-kw">CREATE OR REPLACE TRIGGER</span> <span class="sql-tb">trg_update_avail</span>\n<span class="sql-kw">AFTER INSERT ON</span> <span class="sql-tb">lms_transactions</span>\n<span class="sql-kw">FOR EACH ROW</span>\n<span class="sql-kw">BEGIN</span>\n  <span class="sql-kw">UPDATE</span> <span class="sql-tb">lms_books</span>\n  <span class="sql-kw">SET</span>    available_copies = available_copies - <span class="sql-num">1</span>\n  <span class="sql-kw">WHERE</span>  book_id = :NEW.book_id;\n<span class="sql-kw">END</span>;\n/`,
  },
  stored_proc: {
    label:"STORED PROC",
    code:`<span class="sql-kw">CREATE OR REPLACE PROCEDURE</span> <span class="sql-fn">sp_issue_book</span>(\n  p_member_id <span class="sql-kw">IN</span>  <span class="sql-tb">lms_members.member_id%TYPE</span>,\n  p_book_id   <span class="sql-kw">IN</span>  <span class="sql-tb">lms_books.book_id%TYPE</span>,\n  p_txn_id    <span class="sql-kw">OUT</span> <span class="sql-tb">lms_transactions.txn_id%TYPE</span>\n) <span class="sql-kw">AS</span>\n  v_avail  <span class="sql-fn">NUMBER</span>;\n  v_status <span class="sql-fn">VARCHAR2</span>(<span class="sql-num">20</span>);\n<span class="sql-kw">BEGIN</span>\n  <span class="sql-cm">-- Check member status</span>\n  <span class="sql-kw">SELECT</span> account_status <span class="sql-kw">INTO</span> v_status\n  <span class="sql-kw">FROM</span>   <span class="sql-tb">lms_members</span> <span class="sql-kw">WHERE</span> member_id = p_member_id;\n  <span class="sql-kw">IF</span> v_status != <span class="sql-str">'ACTIVE'</span> <span class="sql-kw">THEN</span>\n    <span class="sql-fn">RAISE_APPLICATION_ERROR</span>(<span class="sql-num">-20001</span>, <span class="sql-str">'Member suspended'</span>);\n  <span class="sql-kw">END IF</span>;\n  <span class="sql-cm">-- Check availability</span>\n  <span class="sql-kw">SELECT</span> available_copies <span class="sql-kw">INTO</span> v_avail\n  <span class="sql-kw">FROM</span>   <span class="sql-tb">lms_books</span> <span class="sql-kw">WHERE</span> book_id = p_book_id;\n  <span class="sql-kw">IF</span> v_avail < <span class="sql-num">1</span> <span class="sql-kw">THEN</span>\n    <span class="sql-fn">RAISE_APPLICATION_ERROR</span>(<span class="sql-num">-20002</span>, <span class="sql-str">'No copies available'</span>);\n  <span class="sql-kw">END IF</span>;\n  <span class="sql-cm">-- Insert transaction</span>\n  p_txn_id := <span class="sql-str">'T'</span>||<span class="sql-fn">seq_txn.NEXTVAL</span>;\n  <span class="sql-kw">INSERT INTO</span> <span class="sql-tb">lms_transactions</span>\n  <span class="sql-kw">VALUES</span>(p_txn_id,p_book_id,p_member_id,<span class="sql-fn">SYSDATE</span>,<span class="sql-fn">SYSDATE</span>+<span class="sql-num">14</span>,<span class="sql-kw">NULL</span>,<span class="sql-num">0</span>,<span class="sql-str">'ISSUED'</span>);\n  <span class="sql-kw">COMMIT</span>;\n<span class="sql-kw">EXCEPTION</span>\n  <span class="sql-kw">WHEN OTHERS THEN ROLLBACK</span>; <span class="sql-kw">RAISE</span>;\n<span class="sql-kw">END</span> sp_issue_book;\n/`,
  },
  schema: {
    label:"SCHEMA DDL",
    code:`<span class="sql-cm">-- Core entities (3NF normalized)</span>\n<span class="sql-kw">CREATE TABLE</span> <span class="sql-tb">lms_books</span> (\n  book_id          <span class="sql-fn">VARCHAR2</span>(<span class="sql-num">10</span>)  <span class="sql-kw">PRIMARY KEY</span>,\n  isbn             <span class="sql-fn">VARCHAR2</span>(<span class="sql-num">20</span>)  <span class="sql-kw">UNIQUE NOT NULL</span>,\n  title            <span class="sql-fn">VARCHAR2</span>(<span class="sql-num">200</span>) <span class="sql-kw">NOT NULL</span>,\n  author_id        <span class="sql-fn">NUMBER</span>         <span class="sql-kw">REFERENCES</span> <span class="sql-tb">lms_authors</span>(author_id),\n  category_id      <span class="sql-fn">NUMBER</span>         <span class="sql-kw">REFERENCES</span> <span class="sql-tb">lms_categories</span>(category_id),\n  total_copies     <span class="sql-fn">NUMBER</span>(<span class="sql-num">3</span>)   <span class="sql-kw">DEFAULT</span> <span class="sql-num">1</span>,\n  available_copies <span class="sql-fn">NUMBER</span>(<span class="sql-num">3</span>)   <span class="sql-kw">DEFAULT</span> <span class="sql-num">1</span>,\n  shelf_loc        <span class="sql-fn">VARCHAR2</span>(<span class="sql-num">10</span>),\n  avg_rating       <span class="sql-fn">NUMBER</span>(<span class="sql-num">3</span>,<span class="sql-num">1</span>),\n  created_dt       <span class="sql-fn">DATE</span>           <span class="sql-kw">DEFAULT SYSDATE</span>,\n  <span class="sql-kw">CONSTRAINT</span> chk_copies <span class="sql-kw">CHECK</span>(available_copies >= <span class="sql-num">0</span>)\n);\n\n<span class="sql-kw">CREATE TABLE</span> <span class="sql-tb">lms_members</span> (\n  member_id        <span class="sql-fn">VARCHAR2</span>(<span class="sql-num">10</span>)  <span class="sql-kw">PRIMARY KEY</span>,\n  full_name        <span class="sql-fn">VARCHAR2</span>(<span class="sql-num">100</span>) <span class="sql-kw">NOT NULL</span>,\n  email            <span class="sql-fn">VARCHAR2</span>(<span class="sql-num">100</span>) <span class="sql-kw">UNIQUE NOT NULL</span>,\n  type_id          <span class="sql-fn">NUMBER</span>         <span class="sql-kw">REFERENCES</span> <span class="sql-tb">lms_member_types</span>(type_id),\n  account_status   <span class="sql-fn">VARCHAR2</span>(<span class="sql-num">15</span>)  <span class="sql-kw">DEFAULT</span> <span class="sql-str">'ACTIVE'</span>,\n  join_date        <span class="sql-fn">DATE</span>           <span class="sql-kw">DEFAULT SYSDATE</span>,\n  expiry_date      <span class="sql-fn">DATE</span>           <span class="sql-kw">NOT NULL</span>\n);\n\n<span class="sql-kw">CREATE TABLE</span> <span class="sql-tb">lms_transactions</span> (\n  txn_id           <span class="sql-fn">VARCHAR2</span>(<span class="sql-num">15</span>)  <span class="sql-kw">PRIMARY KEY</span>,\n  book_id          <span class="sql-fn">VARCHAR2</span>(<span class="sql-num">10</span>)  <span class="sql-kw">REFERENCES</span> <span class="sql-tb">lms_books</span>(book_id),\n  member_id        <span class="sql-fn">VARCHAR2</span>(<span class="sql-num">10</span>)  <span class="sql-kw">REFERENCES</span> <span class="sql-tb">lms_members</span>(member_id),\n  issue_date       <span class="sql-fn">DATE</span>           <span class="sql-kw">DEFAULT SYSDATE</span>,\n  due_date         <span class="sql-fn">DATE</span>           <span class="sql-kw">NOT NULL</span>,\n  return_date      <span class="sql-fn">DATE</span>,\n  fine_amount      <span class="sql-fn">NUMBER</span>(<span class="sql-num">8</span>,<span class="sql-num">2</span>) <span class="sql-kw">DEFAULT</span> <span class="sql-num">0</span>,\n  status           <span class="sql-fn">VARCHAR2</span>(<span class="sql-num">10</span>)\n);`,
  },
};

const SQLPage = () => {
  const [query,   setQuery]  = useState("SELECT * FROM vw_dashboard_stats;");
  const [result,  setResult] = useState(null);
  const [loading, setLoading]= useState(false);
  const [history, setHistory]= useState([]);
  const taRef   = useRef(null);
  const hlRef   = useRef(null);

  // ── syntax highlight (runs on every keystroke, no library needed) ──
  const highlight = sql =>
    sql
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/--.*/g,            m=>`<span style="color:#3d5c3d">${m}</span>`)
      .replace(/'[^']*'/g,         m=>`<span style="color:#a5d6ff">${m}</span>`)
      .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|ON|AS|ORDER|BY|GROUP|HAVING|LIMIT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|VIEW|TRIGGER|PROCEDURE|SHOW|DESCRIBE|USE|CALL|BEGIN|END|IF|THEN|ELSE|DECLARE|AND|OR|IN|LIKE|BETWEEN|IS|DISTINCT|COUNT|SUM|AVG|MAX|MIN|IFNULL|COALESCE|DATE_FORMAT|DATEDIFF|CURDATE|NOW|CONCAT|LPAD|CASE|WHEN|INTERVAL|NOT|NULL|DEFAULT)\b/gi,
        m=>`<span style="color:#ff7b72">${m.toUpperCase()}</span>`)
      .replace(/\b(\d+)\b/g,       m=>`<span style="color:#00c8ff">${m}</span>`);

  // ── sync scroll between textarea and highlight layer ──
  const syncScroll = () => {
    if (hlRef.current && taRef.current) {
      hlRef.current.scrollTop  = taRef.current.scrollTop;
      hlRef.current.scrollLeft = taRef.current.scrollLeft;
    }
  };

  // ── run query against the backend ──
  const runQuery = async () => {
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true); setResult(null);
    try {
      const res  = await fetch("http://localhost:5000/api/sql/execute", {
        method : "POST",
        headers: { "Content-Type":"application/json" },
        body   : JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setResult(data);
      setHistory(h => [{ q, ok: data.success, rows: data.rowCount, ts: new Date() }, ...h.slice(0,29)]);
    } catch(e) {
      setResult({ success:false, error: e.message });
    } finally {
      setLoading(false);
    }
  };

  // ── keyboard shortcuts ──
  const onKey = e => {
    if ((e.ctrlKey||e.metaKey) && e.key==="Enter") { e.preventDefault(); runQuery(); }
    if (e.key==="Tab") {
      e.preventDefault();
      const s = taRef.current.selectionStart;
      const v = query.slice(0,s)+"  "+query.slice(taRef.current.selectionEnd);
      setQuery(v);
      requestAnimationFrame(()=>{ taRef.current.selectionStart=taRef.current.selectionEnd=s+2; });
    }
  };

  // ── quick snippet queries ──
  const SNIPS = [
    { label:"All books",          q:`SELECT b.book_id, b.title, a.full_name AS author, c.category_name, b.available_copies, b.shelf_loc\nFROM lms_books b\nJOIN lms_authors a ON b.author_id=a.author_id\nJOIN lms_categories c ON b.category_id=c.category_id\nORDER BY b.title;` },
    { label:"Available books",    q:`SELECT book_id, title, available_copies, shelf_loc FROM lms_books WHERE available_copies > 0 ORDER BY title;` },
    { label:"All members",        q:`SELECT m.member_id, m.full_name, mt.type_name AS tier, m.account_status, DATE_FORMAT(m.expiry_date,'%Y-%m-%d') AS expiry\nFROM lms_members m JOIN lms_member_types mt ON m.type_id=mt.type_id ORDER BY m.full_name;` },
    { label:"Overdue books",      q:`SELECT t.txn_id, b.title, m.full_name AS member,\n  DATE_FORMAT(t.due_date,'%Y-%m-%d') AS due_date,\n  DATEDIFF(CURDATE(),t.due_date) AS days_overdue,\n  DATEDIFF(CURDATE(),t.due_date)*2 AS fine_accrued\nFROM lms_transactions t\nJOIN lms_books b ON t.book_id=b.book_id\nJOIN lms_members m ON t.member_id=m.member_id\nWHERE t.return_date IS NULL AND t.due_date < CURDATE()\nORDER BY days_overdue DESC;` },
    { label:"Pending fines",      q:`SELECT f.fine_id, m.full_name AS member, b.title AS book, f.amount\nFROM lms_fines f\nJOIN lms_transactions t ON f.txn_id=t.txn_id\nJOIN lms_members m ON f.member_id=m.member_id\nJOIN lms_books b ON t.book_id=b.book_id\nWHERE f.paid_flag='N' ORDER BY f.amount DESC;` },
    { label:"Dashboard stats",    q:`SELECT * FROM vw_dashboard_stats;` },
    { label:"Active transactions",q:`SELECT * FROM vw_active_transactions ORDER BY days_overdue DESC;` },
    { label:"Books per category", q:`SELECT c.category_name, COUNT(b.book_id) AS books, SUM(b.available_copies) AS available\nFROM lms_categories c LEFT JOIN lms_books b ON c.category_id=b.category_id\nGROUP BY c.category_name ORDER BY books DESC;` },
    { label:"Show tables",        q:`SHOW TABLES;` },
    { label:"Describe books",     q:`DESCRIBE lms_books;` },
    { label:"Show triggers",      q:`SHOW TRIGGERS;` },
    { label:"Show procedures",    q:`SHOW PROCEDURE STATUS WHERE Db='library_db';` },
  ];

  // ── render result body ──
  const renderResult = () => {
    if (loading) return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:14 }}>
        <div style={{ width:28, height:28, border:"2px solid rgba(0,255,136,.2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
        <span className="mono" style={{ fontSize:11, color:"var(--muted2)" }}>EXECUTING...</span>
      </div>
    );
    if (!result) return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:12 }}>
        <span style={{ fontFamily:"var(--mono)", fontSize:28, opacity:.2 }}>▶_</span>
        <span className="mono" style={{ fontSize:11, color:"var(--muted2)" }}>Press <span style={{color:"var(--green)"}}>Ctrl+Enter</span> or click RUN to execute</span>
      </div>
    );
    if (!result.success) return (
      <div style={{ padding:24 }}>
        <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--red)", lineHeight:1.8, background:"rgba(255,56,96,.06)", border:"1px solid rgba(255,56,96,.2)", padding:"14px 18px" }}>
          ✕ &nbsp; {result.error}
        </div>
      </div>
    );
    // non-SELECT (INSERT/UPDATE/DELETE)
    if (result.affectedRows != null && !result.columns?.length) return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:12 }}>
        <div className="display" style={{ fontSize:56, fontWeight:900, color:"var(--green)", textShadow:"0 0 30px rgba(0,255,136,.4)" }}>{result.affectedRows}</div>
        <span className="mono" style={{ fontSize:11, color:"var(--muted2)", letterSpacing:".1em" }}>ROW{result.affectedRows!==1?"S":""} AFFECTED</span>
        {result.message && <span className="mono" style={{ fontSize:10, color:"var(--green2)" }}>{result.message}</span>}
      </div>
    );
    // empty SELECT
    if (!result.rows?.length) return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%" }}>
        <span className="mono" style={{ fontSize:12, color:"var(--muted2)" }}>∅ &nbsp; Query returned 0 rows.</span>
      </div>
    );
    // SELECT with rows — scrollable table
    const isNum = v => v!==null && v!=="" && !isNaN(Number(v));
    return (
      <div style={{ overflow:"auto", height:"100%", animation:"fadeIn .3s ease" }}>
        <table className="cyber-table" style={{ fontFamily:"var(--mono)", fontSize:12 }}>
          <thead>
            <tr>{result.columns.map(c=>(
              <th key={c} style={{ position:"sticky", top:0, background:"var(--surface)", zIndex:2, padding:"9px 14px", fontSize:9, letterSpacing:".14em", textTransform:"uppercase", color:"var(--green2)", borderBottom:"1px solid rgba(0,255,136,.15)", whiteSpace:"nowrap" }}>{c}</th>
            ))}</tr>
          </thead>
          <tbody>
            {result.rows.map((row,i)=>(
              <tr key={i} style={{ animation:`rowIn .3s ease ${i*.02}s both` }}>
                {result.columns.map(col=>{
                  const v = row[col];
                  if (v===null||v===undefined) return <td key={col} style={{ padding:"9px 14px", borderBottom:"1px solid rgba(0,255,136,.04)", color:"var(--muted)", fontStyle:"italic" }}>NULL</td>;
                  if (isNum(v)&&!["book_id","member_id","txn_id"].includes(col)) return <td key={col} style={{ padding:"9px 14px", borderBottom:"1px solid rgba(0,255,136,.04)", color:"var(--cyan)" }}>{String(v)}</td>;
                  return <td key={col} style={{ padding:"9px 14px", borderBottom:"1px solid rgba(0,255,136,.04)", color:"var(--text)", maxWidth:260, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{String(v)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ display:"flex", flex:1, overflow:"hidden", height:"100%" }}>

      {/* ── Snippets sidebar ── */}
      <div style={{ width:200, flexShrink:0, background:"var(--bg2)", borderRight:"1px solid var(--border2)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div className="mono" style={{ padding:"12px 14px", borderBottom:"1px solid var(--border2)", fontSize:9, letterSpacing:".18em", textTransform:"uppercase", color:"var(--green)" }}>
          // QUICK QUERIES
        </div>
        <div style={{ overflowY:"auto", flex:1, padding:8 }}>
          {SNIPS.map(s=>(
            <button key={s.label} onClick={()=>setQuery(s.q)}
              style={{ width:"100%", textAlign:"left", padding:"7px 10px", background:"transparent", border:"1px solid transparent", color:"var(--muted2)", cursor:"pointer", fontFamily:"var(--mono)", fontSize:11, transition:"all .18s", borderRadius:3, display:"flex", alignItems:"center", gap:6, marginBottom:2 }}
              onMouseEnter={e=>{ e.currentTarget.style.color="var(--green)"; e.currentTarget.style.borderColor="rgba(0,255,136,.2)"; e.currentTarget.style.background="rgba(0,255,136,.04)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.color="var(--muted2)"; e.currentTarget.style.borderColor="transparent"; e.currentTarget.style.background="transparent"; }}
            >
              <span style={{ color:"var(--muted)", fontSize:13 }}>›</span> {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Editor + Results ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Editor */}
        <div style={{ flexShrink:0, borderBottom:"1px solid var(--border2)" }}>
          {/* mac-style title bar */}
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 16px", background:"var(--surface2)", borderBottom:"1px solid rgba(0,255,136,.06)" }}>
            <div style={{ display:"flex", gap:6 }}>
              {["#ff5f56","#ffbd2e","#27c93f"].map(c=><div key={c} style={{ width:10, height:10, borderRadius:"50%", background:c }} />)}
            </div>
            <span className="mono" style={{ fontSize:10, color:"var(--muted2)", marginLeft:8, letterSpacing:".1em" }}>library_db — query editor</span>
            {result && (
              <span className="mono" style={{ marginLeft:"auto", fontSize:9, color: result.success?"var(--green)":"var(--red)" }}>
                {result.success ? `✓ ${result.rowCount??result.affectedRows??0} rows · ${result.ms}ms` : `✕ error · ${result.ms}ms`}
              </span>
            )}
          </div>

          {/* Syntax-highlighted editor */}
          <div style={{ position:"relative", minHeight:150, maxHeight:260 }}>
            {/* highlight layer */}
            <div ref={hlRef}
              style={{ position:"absolute", inset:0, padding:"14px 16px", fontFamily:"var(--mono)", fontSize:13, lineHeight:1.7, color:"var(--text)", whiteSpace:"pre-wrap", wordBreak:"break-all", pointerEvents:"none", overflow:"auto", background:"var(--bg)" }}
              dangerouslySetInnerHTML={{ __html: highlight(query)+"\n" }}
            />
            {/* transparent textarea on top */}
            <textarea ref={taRef} value={query}
              onChange={e=>{ setQuery(e.target.value); syncScroll(); }}
              onScroll={syncScroll} onKeyDown={onKey}
              spellCheck={false} autoComplete="off"
              placeholder="-- Write your SQL here..."
              style={{ position:"absolute", inset:0, width:"100%", height:"100%", padding:"14px 16px", background:"transparent", border:"none", outline:"none", fontFamily:"var(--mono)", fontSize:13, lineHeight:1.7, color:"transparent", caretColor:"var(--green)", resize:"none", overflow:"auto", zIndex:1 }}
            />
          </div>

          {/* Run bar */}
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 16px", background:"var(--surface2)", borderTop:"1px solid rgba(0,255,136,.06)" }}>
            <button className="btn-neon" onClick={runQuery} disabled={loading}
              style={{ fontSize:11, padding:"8px 22px", opacity: loading?.5:1, cursor: loading?"not-allowed":"pointer" }}>
              <span>{loading ? "RUNNING..." : "▶  RUN QUERY"}</span>
            </button>
            <button className="btn-ghost" onClick={()=>{ setQuery(""); setResult(null); }} style={{ fontSize:10 }}>
              CLEAR
            </button>
            <div style={{ marginLeft:"auto", fontFamily:"var(--mono)", fontSize:9, color:"var(--muted)", display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ padding:"2px 6px", border:"1px solid var(--muted)", borderRadius:3, fontSize:9 }}>Ctrl</span>+
              <span style={{ padding:"2px 6px", border:"1px solid var(--muted)", borderRadius:3, fontSize:9 }}>Enter</span>
              to run &nbsp;&nbsp;
              <span style={{ padding:"2px 6px", border:"1px solid var(--muted)", borderRadius:3, fontSize:9 }}>Tab</span>
              to indent
            </div>
          </div>
        </div>

        {/* Results panel */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* result header */}
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 16px", background:"var(--surface2)", borderBottom:"1px solid rgba(0,255,136,.06)", flexShrink:0 }}>
            {loading ? (
              <>
                <div style={{ width:14, height:14, border:"2px solid rgba(0,255,136,.2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
                <span className="mono" style={{ fontSize:10, letterSpacing:".14em", color:"var(--muted2)" }}>EXECUTING...</span>
              </>
            ) : !result ? (
              <span className="mono" style={{ fontSize:10, letterSpacing:".14em", color:"var(--muted2)" }}>RESULTS</span>
            ) : (
              <>
                <span className="mono" style={{ fontSize:10, letterSpacing:".14em", color: result.success?"var(--green)":"var(--red)" }}>
                  {result.success ? "QUERY RESULT" : "ERROR"}
                </span>
                {result.rowCount!=null && <span className="tag tag-green">{result.rowCount} rows</span>}
                {result.columns?.length>0 && <span className="tag tag-cyan">{result.columns.length} cols</span>}
                {result.affectedRows!=null && <span className="tag tag-orange">{result.affectedRows} affected</span>}
                {result.ms!=null && <span className="tag tag-muted" style={{ marginLeft:"auto" }}>{result.ms}ms</span>}
              </>
            )}
          </div>
          {/* result body */}
          <div style={{ flex:1, overflow:"hidden", background:"var(--bg)" }}>
            {renderResult()}
          </div>
        </div>

      </div>

      {/* ── History sidebar ── */}
      <div style={{ width:190, flexShrink:0, background:"var(--bg2)", borderLeft:"1px solid var(--border2)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div className="mono" style={{ padding:"12px 14px", borderBottom:"1px solid var(--border2)", fontSize:9, letterSpacing:".18em", textTransform:"uppercase", color:"var(--green)" }}>
          // HISTORY
        </div>
        <div style={{ overflowY:"auto", flex:1, padding:6 }}>
          {history.length===0
            ? <div className="mono" style={{ fontSize:10, color:"var(--muted)", padding:10 }}>No queries yet.</div>
            : history.map((h,i)=>(
              <div key={i} onClick={()=>setQuery(h.q)}
                style={{ padding:"8px 10px", cursor:"pointer", border:"1px solid transparent", borderRadius:3, marginBottom:4, transition:"all .18s" }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor="rgba(0,255,136,.2)"; e.currentTarget.style.background="rgba(0,255,136,.04)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor="transparent"; e.currentTarget.style.background="transparent"; }}
                title="Click to restore"
              >
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", marginBottom:4 }}>
                  {h.ts.toLocaleTimeString("en-IN",{hour12:false})} &nbsp;
                  <span style={{ color: h.ok?"var(--green2)":"var(--red)" }}>
                    {h.ok ? `✓ ${h.rows??0}r` : "✕"}
                  </span>
                </div>
                <div className="mono" style={{ fontSize:10, color:"var(--muted2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:160 }}>
                  {h.q}
                </div>
              </div>
            ))
          }
        </div>
      </div>

    </div>
  );
};
/* ═══════════════════════════════════════════════════════════════════════════
   ROOT APP
   ═══════════════════════════════════════════════════════════════════════════ */
export default function LibraryApp() {
  const [entered, setEntered]   = useState(false);
  const [page, setPage]         = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast]       = useState(null);

  // Oracle data state
  const [books,        setBooks]        = useState([]);
  const [members,      setMembers]      = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats,        setStats]        = useState({});
  const [loadingBooks,    setLB] = useState(true);
  const [loadingMembers,  setLM] = useState(true);
  const [loadingTxns,     setLT] = useState(true);
  const [loadingStats,    setLS] = useState(true);

  const showToast = useCallback((msg, type="success") => {
    setToast({ msg, type, id:Date.now() });
  }, []);

  const overdueAlertCount = transactions.filter((t) => {
    if (String(t.status || "").toUpperCase() === "RETURNED") return false;
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  const fetchBooks = useCallback(() => {
    setLB(true);
    API.getBooks()
      .then(setBooks)
      .catch(e => showToast(e.message || "Failed to load books", "error"))
      .finally(() => setLB(false));
  }, [showToast]);

  const fetchMembers = useCallback(() => {
    setLM(true);
    API.getMembers()
      .then(setMembers)
      .catch(e => showToast(e.message || "Failed to load members", "error"))
      .finally(() => setLM(false));
  }, [showToast]);

  const fetchTransactions = useCallback(() => {
    setLT(true);
    API.getTransactions()
      .then(setTransactions)
      .catch(e => showToast(e.message || "Failed to load transactions", "error"))
      .finally(() => setLT(false));
  }, [showToast]);

  const fetchStats = useCallback(() => {
    setLS(true);
    API.getStats()
      .then(setStats)
      .catch(e => showToast(e.message || "Failed to load stats", "error"))
      .finally(() => setLS(false));
  }, [showToast]);

  // Parallel Oracle fetches on dashboard mount
  useEffect(() => {
    if (!entered) return;
    fetchBooks();
    fetchMembers();
    fetchTransactions();
    fetchStats();
  }, [entered, fetchBooks, fetchMembers, fetchTransactions, fetchStats]);

  // Keep transactions panel live while the app is open.
  useEffect(() => {
    if (!entered) return;
    const iv = setInterval(() => {
      fetchTransactions();
      fetchStats();
    }, 15000);
    return () => clearInterval(iv);
  }, [entered, fetchTransactions, fetchStats]);

  if (!entered) {
    return (
      <>
        <GlobalStyles />
        <CursorTrail />
        <Hero
          onEnter={() => setEntered(true)}
          onViewSchema={() => {
            setPage("sql");
            setEntered(true);
          }}
        />
      </>
    );
  }

  const renderPage = () => {
    switch(page) {
      case "dashboard": return <DashboardPage stats={stats}   transactions={transactions} loading={loadingStats||loadingTxns} />;
      case "books":     return <BooksPage     books={books}   setBooks={setBooks}   loading={loadingBooks}   showToast={showToast} />;
      case "members":   return <MembersPage   members={members} setMembers={setMembers} loading={loadingMembers} showToast={showToast} refreshMembers={fetchMembers} />;
      case "issue":     return <IssuePage     books={books} members={members} transactions={transactions} setTransactions={setTransactions} loading={loadingTxns} showToast={showToast} />;
      case "fines":     return <FinesPage     transactions={transactions} loading={loadingTxns} showToast={showToast} />;
      case "reports":   return <ReportsPage   books={books} transactions={transactions} loading={loadingBooks} />;
      case "sql":       return <SQLPage />;
      default:          return <DashboardPage stats={stats} transactions={transactions} loading={loadingStats} />;
    }
  };

  return (
    <>
      <GlobalStyles />
      <CursorTrail />
      <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"var(--bg)" }}>
        <Sidebar page={page} setPage={setPage} collapsed={collapsed} toggle={() => setCollapsed(c=>!c)} />
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <Topbar page={page} showToast={showToast} onGoFront={() => setEntered(false)} overdueAlertCount={overdueAlertCount} />
          <main style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
            {renderPage()}
          </main>
        </div>
      </div>
      {toast && <Toast key={toast.id} msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
