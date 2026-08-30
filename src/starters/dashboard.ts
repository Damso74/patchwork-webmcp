import type { StarterDefinition } from "./types";

export const dashboardStarter: StarterDefinition = {
  id: "dashboard",
  name: "Mini dashboard",
  projectName: "Canopy Metrics",
  description:
    "A compact operations dashboard with local data and useful density.",
  accent: "#42675a",
  files: {
    "/src/main.tsx": `import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
createRoot(document.getElementById('root')!).render(<App />);`,
    "/src/metrics.ts": `export const metrics = [
  { label: 'Active projects', value: '24', delta: '+12%' },
  { label: 'On-time delivery', value: '91%', delta: '+4.2%' },
  { label: 'Team focus', value: '7.4h', delta: '+0.8h' },
];
export const projects = [
  { name: 'Seed Library', owner: 'Mina Cho', status: 'On track', progress: 82 },
  { name: 'Field Notes', owner: 'Jon Bell', status: 'Review', progress: 64 },
  { name: 'North Garden', owner: 'Rae Patel', status: 'At risk', progress: 41 },
  { name: 'Common Ground', owner: 'Iris Okafor', status: 'On track', progress: 73 },
];`,
    "/src/App.tsx": `import { metrics, projects } from './metrics';
export default function App(){return <div className="app"><aside><div className="logo"><i>C</i>Canopy</div><nav><a className="active">Overview</a><a>Projects</a><a>People</a><a>Reports</a></nav><div className="profile"><span>AM</span><p><b>Alex Morgan</b><small>Workspace admin</small></p></div></aside><main><header><div><p>Monday, August 30</p><h1>Good morning, Alex.</h1></div><button>+ New report</button></header><section className="cards">{metrics.map((m,i)=><article key={m.label}><div className={'spark s'+i}></div><p>{m.label}</p><h2>{m.value}</h2><span>{m.delta} this month</span></article>)}</section><section className="panel"><div className="panel-head"><div><p>Current portfolio</p><h2>Project health</h2></div><div className="filters"><button className="selected">All</button><button>Active</button><button>Review</button></div></div><div className="table"><div className="row labels"><span>Project</span><span>Owner</span><span>Progress</span><span>Status</span></div>{projects.map(p=><div className="row" key={p.name}><strong>{p.name}</strong><span>{p.owner}</span><span className="progress"><i style={{width:p.progress+'%'}}></i><em>{p.progress}%</em></span><span className={'status '+p.status.replace(' ','').toLowerCase()}>{p.status}</span></div>)}</div></section></main></div>}`,
    "/src/styles.css": `*{box-sizing:border-box}body{margin:0;background:#edf0eb;color:#17251e;font-family:Inter,ui-sans-serif,system-ui}.app{display:grid;grid-template-columns:210px 1fr;min-height:100vh}aside{background:#183328;color:#dbe7df;padding:28px 22px;display:flex;flex-direction:column}.logo{font-size:19px;font-weight:700;display:flex;align-items:center;gap:10px}.logo i{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:#cbe658;color:#183328;font-style:normal}aside nav{display:grid;gap:8px;margin-top:58px}aside nav a{padding:11px 13px;color:#9db2a7;font-size:14px;border-radius:9px}.active{background:#29493c;color:#fff!important}.profile{margin-top:auto;display:flex;gap:10px;align-items:center;border-top:1px solid #315044;padding-top:20px}.profile>span{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#e6b36a;color:#183328;font-size:11px}.profile p{margin:0;font-size:12px}.profile small{display:block;color:#88a094;margin-top:3px}main{padding:36px 4vw}header{display:flex;justify-content:space-between;align-items:center}header p,.panel-head p{margin:0 0 7px;color:#758178;font-size:12px}h1{margin:0;font-size:29px;letter-spacing:-.03em}header button{border:0;border-radius:10px;background:#183328;color:white;padding:12px 16px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:35px 0}.cards article{position:relative;background:white;border:1px solid #dce1da;border-radius:15px;padding:22px;overflow:hidden}.cards p{color:#76827a;margin:0 0 20px;font-size:13px}.cards h2{font-size:32px;margin:0}.cards span{font-size:11px;color:#4d765e}.spark{position:absolute;right:18px;bottom:22px;width:62px;height:26px;border-bottom:2px solid #81a68f;transform:skewY(-16deg);opacity:.6}.s1{border-color:#dfaa61;transform:skewY(12deg)}.s2{border-color:#7892c7}.panel{background:#fff;border:1px solid #dce1da;border-radius:16px;overflow:hidden}.panel-head{display:flex;justify-content:space-between;padding:23px 25px;border-bottom:1px solid #e5e9e3}.panel-head h2{margin:0;font-size:19px}.filters{background:#f1f3ef;border-radius:9px;padding:3px}.filters button{background:none;border:0;padding:7px 11px;font-size:11px;color:#718078}.filters .selected{background:#fff;border-radius:7px;box-shadow:0 1px 4px #253a2d18;color:#183328}.table{padding:0 25px}.row{display:grid;grid-template-columns:1.2fr 1fr 1fr 85px;align-items:center;gap:18px;min-height:62px;border-bottom:1px solid #edf0ec;font-size:12px}.labels{min-height:43px;color:#8a958d;font-size:10px;text-transform:uppercase;letter-spacing:.06em}.progress{display:flex;align-items:center;gap:8px;height:4px;background:#e8ece8;border-radius:3px;position:relative}.progress i{height:4px;background:#6f9880;border-radius:3px}.progress em{font-style:normal;font-size:10px;color:#748078}.status{padding:6px 8px;text-align:center;border-radius:99px;background:#e4efe7;color:#3d7452}.review{background:#f5ead9;color:#976a2f}.atrisk{background:#f3dfda;color:#a35344}@media(max-width:700px){.app{display:block}aside{padding:18px 20px;display:flex;flex-direction:row;align-items:center}aside nav{display:none}.profile{display:none}main{padding:25px 18px}header h1{font-size:23px}.cards{grid-template-columns:1fr}.panel{overflow-x:auto}.panel-head{min-width:620px}.table{min-width:620px}}`,
  },
};
