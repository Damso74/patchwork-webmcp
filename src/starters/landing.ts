import type { StarterDefinition } from "./types";

export const landingStarter: StarterDefinition = {
  id: "landing",
  name: "Landing page",
  projectName: "Relay",
  description: "A tidy creative brief product ready for a bold transformation.",
  accent: "#d96f4c",
  files: {
    "/src/main.tsx": `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>
);`,
    "/src/content.ts": `export const features = [
  { number: '01', title: 'Capture the brief', text: 'Turn a loose idea into a focused creative direction.' },
  { number: '02', title: 'Invite your team', text: 'Keep decisions and feedback in one calm workspace.' },
  { number: '03', title: 'Ship with clarity', text: 'Move from first thought to final handoff without the noise.' },
];`,
    "/src/App.tsx": `import { features } from './content';

export default function App() {
  return (
    <main>
      <nav>
        <a className="brand" href="#top">Relay<span>.</span></a>
        <div className="nav-links"><a href="#features">Features</a><a href="#about">About</a></div>
        <button className="nav-button">Start a brief</button>
      </nav>

      <section className="hero" id="top">
        <p className="eyebrow">A shared space for better creative work</p>
        <h1>From first thought<br />to clear direction.</h1>
        <p className="lede">Relay helps small teams shape ideas, align quickly, and move meaningful work forward.</p>
        <div className="hero-actions"><button>Start for free</button><a href="#features">See how it works <span>→</span></a></div>
        <div className="signal"><span>R</span><p><strong>Project Northstar</strong><br />Brief approved · 2 min ago</p></div>
      </section>

      <section className="features" id="features">
        {features.map((feature) => <article key={feature.number}><span>{feature.number}</span><h2>{feature.title}</h2><p>{feature.text}</p></article>)}
      </section>

      <footer id="about"><p>Relay — thoughtful tools for creative teams.</p><span>Made for the work between the work.</span></footer>
    </main>
  );
}`,
    "/src/styles.css": `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Manrope:wght@600;700&display=swap');
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f3f0e9;color:#1d2822;font-family:'DM Sans',sans-serif}button,a{font:inherit}button{cursor:pointer}main{min-height:100vh;padding:0 6vw}nav{height:82px;display:flex;align-items:center;border-bottom:1px solid #d8d2c7;gap:42px}.brand{font:700 23px Manrope;text-decoration:none;color:#1d2822}.brand span{color:#d96f4c}.nav-links{display:flex;gap:28px;margin-right:auto}.nav-links a,.hero-actions a{color:#536159;text-decoration:none;font-size:14px}.nav-button,.hero-actions button{border:0;border-radius:99px;background:#1d2822;color:#fff;padding:12px 20px}.hero{position:relative;padding:12vh 0 10vh;max-width:1060px}.eyebrow{text-transform:uppercase;letter-spacing:.14em;font-size:12px;color:#617067}.hero h1{font:700 clamp(52px,8vw,105px)/.93 Manrope;margin:24px 0;letter-spacing:-.06em}.lede{max-width:520px;font-size:19px;line-height:1.55;color:#58655e}.hero-actions{display:flex;align-items:center;gap:28px;margin-top:35px}.hero-actions button{background:#d96f4c;padding:15px 24px}.hero-actions span{margin-left:8px}.signal{position:absolute;right:0;bottom:12%;display:flex;align-items:center;gap:12px;background:#fff;padding:14px 18px;border-radius:16px;box-shadow:0 20px 60px #26352b18;transform:rotate(2deg)}.signal>span{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:#dce8df;color:#476858;font-weight:600}.signal p{font-size:12px;line-height:1.55;margin:0;color:#66716a}.signal strong{color:#1d2822}.features{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #d8d2c7;border-bottom:1px solid #d8d2c7}.features article{padding:42px 38px 48px 0}.features article+article{border-left:1px solid #d8d2c7;padding-left:38px}.features span{font-size:12px;color:#d96f4c}.features h2{font:600 21px Manrope;margin:28px 0 12px}.features p{color:#657069;line-height:1.55;margin:0}footer{display:flex;justify-content:space-between;padding:35px 0 50px;color:#67736c;font-size:13px}@media(max-width:700px){main{padding:0 22px}.nav-links{display:none}.nav-button{margin-left:auto}.hero{padding:80px 0}.hero h1{font-size:52px}.signal{position:relative;right:auto;bottom:auto;margin-top:54px;max-width:260px}.features{grid-template-columns:1fr}.features article+article{border-left:0;border-top:1px solid #d8d2c7;padding-left:0}.features article{padding:30px 0}footer{display:block}footer span{display:block;margin-top:8px}}`,
  },
};
