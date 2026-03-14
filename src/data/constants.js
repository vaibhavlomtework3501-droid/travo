// ═══════════════ STYLES ═══════════════
export const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'DM Sans', system-ui, sans-serif; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes spinA  { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes toastIn{ from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulseR { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.2);opacity:0} }
  .fu  { animation: fadeUp  0.5s ease forwards; }
  .fi  { animation: fadeIn  0.4s ease forwards; }
  .flt { animation: float   4s ease-in-out infinite; }
  .spn { animation: spinA   1s linear infinite; }
  .ti  { animation: toastIn 0.3s ease forwards; }
  .d1{animation-delay:.08s;opacity:0} .d2{animation-delay:.16s;opacity:0}
  .d3{animation-delay:.24s;opacity:0} .d4{animation-delay:.32s;opacity:0}
  .d5{animation-delay:.40s;opacity:0} .d6{animation-delay:.48s;opacity:0}
`;

// ═══════════════ DATA ═══════════════
export const DEMO_USERS = [
  { email:"admin@transportx.in",   password:"admin123",   name:"Admin User",   role:"Super Admin",     avatar:"A" },
  { email:"manager@transportx.in", password:"manager123", name:"Raj Malhotra", role:"Fleet Manager",   avatar:"R" },
  { email:"ops@transportx.in",     password:"ops123",     name:"Divya Sharma", role:"Operations Lead", avatar:"D" },
];

export const INIT_EMP = [
  { id:"EMP001", name:"Arjun Sharma",  coords:"25.3420°N 82.9730°E", address:"Sarnath, Varanasi",        shift:"09:00 AM", status:"pending",  routeId:null },
  { id:"EMP002", name:"Priya Mehta",   coords:"25.3250°N 82.9620°E", address:"BHU Campus, Lanka, Varanasi",   shift:"08:30 AM", status:"approved", routeId:"R01" },
  { id:"EMP003", name:"Rahul Verma",   coords:"25.2980°N 82.9980°E", address:"Ramnagar, Varanasi",  shift:"09:00 AM", status:"pending",  routeId:null },
  { id:"EMP004", name:"Sneha Kapoor",  coords:"25.3120°N 82.9760°E", address:"Assi Ghat, Varanasi",   shift:"10:00 AM", status:"rejected", routeId:null },
  { id:"EMP005", name:"Karan Singh",   coords:"25.3780°N 82.9850°E", address:"Babatpur, Varanasi",    shift:"08:30 AM", status:"pending",  routeId:null },
  { id:"EMP006", name:"Neha Gupta",    coords:"25.3350°N 82.9900°E", address:"Sigra, Varanasi",     shift:"09:00 AM", status:"approved", routeId:"R02" },
  { id:"EMP007", name:"Amit Tiwari",   coords:"25.3090°N 83.0070°E", address:"Raj Ghat, Varanasi",      shift:"10:00 AM", status:"pending",  routeId:null },
  { id:"EMP008", name:"Riya Bose",     coords:"25.3200°N 83.0040°E", address:"Lahurabir, Varanasi",      shift:"09:00 AM", status:"approved", routeId:"R01" },
];

export const INIT_DRV = [
  { id:"D001", name:"Ramesh Kumar",  license:"DL-2019-001234", phone:"+91 98765 43210", carId:"C001", routeId:"R01", status:"active" },
  { id:"D002", name:"Suresh Yadav",  license:"DL-2018-006789", phone:"+91 87654 32109", carId:"C002", routeId:"R02", status:"active" },
  { id:"D003", name:"Mahesh Pandey", license:"UP-2020-003456", phone:"+91 76543 21098", carId:"C003", routeId:"R03", status:"on-leave" },
  { id:"D004", name:"Vijay Chauhan", license:"DL-2021-008901", phone:"+91 65432 10987", carId:null,   routeId:null,  status:"available" },
];

export const INIT_CARS = [
  { id:"C001", number:"UP 65 CA 1234", type:"6 Seater", capacity:6, driverId:"D001", status:"active" },
  { id:"C002", number:"UP 65 CB 5678", type:"4 Seater", capacity:4, driverId:"D002", status:"active" },
  { id:"C003", number:"UP 65 CC 9012", type:"6 Seater", capacity:6, driverId:"D003", status:"maintenance" },
  { id:"C004", number:"UP 65 CD 3456", type:"4 Seater", capacity:4, driverId:null,   status:"available" },
  { id:"C005", number:"UP 65 CE 7890", type:"6 Seater", capacity:6, driverId:null,   status:"available" },
];

export const INIT_ROUTES = [
  { id:"R01", name:"Sarnath–BHU Express", driverId:"D001", carId:"C001", employeeIds:["EMP002","EMP008"], shift:"09:00 AM" },
  { id:"R02", name:"Airport–Sigra Route",        driverId:"D002", carId:"C002", employeeIds:["EMP006"],          shift:"08:30 AM" },
  { id:"R03", name:"Ramnagar–Cantt Link",           driverId:"D003", carId:"C003", employeeIds:[],                  shift:"10:00 AM" },
];

export const NAV_ITEMS = [
  { id:"dashboard", label:"Dashboard",         icon:"grid" },
  { id:"boarding",  label:"Boarding Requests", icon:"clipboard" },
  { id:"employees", label:"Employees",          icon:"users" },
  { id:"routes",    label:"Routes Management",  icon:"map" },
  { id:"trips",     label:"Trips",              icon:"truck" },
  { id:"tracking",  label:"Live Tracking",      icon:"locate", adminOnly: true },
  { id:"drivers",   label:"Drivers",            icon:"user" },
  { id:"cars",      label:"Cars",     icon:"truck" },
  // { id:"schedule",  label:"Driver Schedule",    icon:"calendar" },
  { id:"reports",   label:"Reports",            icon:"chart" },
  { id:"settings",  label:"Settings",           icon:"cog" },
];

// ═══════════════ SVG ICON PATHS ═══════════════
export const PATHS = {
  grid:      "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm9.75-9.75A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
  clipboard: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z",
  users:     "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  map:       "M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z",
  user:      "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
  truck:     "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12",
  calendar:  "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
  chart:     "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  cog:       "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z",
  bell:      "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
  search:    "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
  menu:      "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5",
  check:     "M4.5 12.75l6 6 9-13.5",
  x:         "M6 18L18 6M6 6l12 12",
  plus:      "M12 4.5v15m7.5-7.5h-15",
  edit:      "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125",
  trash:     "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0",
  pin:       "M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
  arrow:     "M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3",
  arrowL:    "M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18",
  chevD:     "M19.5 8.25l-7.5 7.5-7.5-7.5",
  chevR:     "M8.25 4.5l7.5 7.5-7.5 7.5",
  logout:    "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75",
  lock:      "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
  mail:      "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
  eye:       "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  eyeOff:    "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88",
  warn:      "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
  swap:      "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
  locate:    "M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
  signal:    "M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
  speed:     "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
  pause:     "M15.75 5.25v13.5m-7.5-13.5v13.5",
  play:      "M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z",
  refresh:   "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99",
  phone:     "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z",
};

export const uid = () => Math.random().toString(36).slice(2, 7).toUpperCase();
