import { useState } from "react";
import ApiSettings from "./ApiSettings";
import {
  Activity, Bot, Boxes, BrainCircuit, Code2, Gauge, GitBranch,
  LayoutDashboard, LockKeyhole, MessageSquare, Play, ShieldCheck,
  Sparkles, TestTube2, Workflow
} from "lucide-react";

type Agent = {
  name: string;
  role: string;
  description: string;
  icon: typeof Bot;
  color: string;
};

const agents: Agent[] = [
  { name: "Directeur IA", role: "Orchestrateur", description: "Découpe les objectifs et distribue les tâches aux spécialistes.", icon: BrainCircuit, color: "violet" },
  { name: "Architecte", role: "Conception", description: "Définit la structure technique et les choix d'architecture.", icon: Boxes, color: "blue" },
  { name: "Développeur", role: "Programmation", description: "Prépare le code et propose des modifications contrôlables.", icon: Code2, color: "cyan" },
  { name: "Testeur", role: "Qualité", description: "Conçoit les tests et repère les régressions.", icon: TestTube2, color: "green" },
  { name: "Optimiseur", role: "Performances", description: "Surveille le poids, la mémoire et les performances.", icon: Gauge, color: "orange" },
  { name: "Documentaliste", role: "Documentation", description: "Garde les décisions, consignes et notes du projet.", icon: MessageSquare, color: "pink" }
];

export default function App() {
  const [goal, setGoal] = useState("");
  const [notice, setNotice] = useState("Le tableau de bord est prêt. Les connexions IA seront activées après la mise en place du serveur sécurisé.");

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkles size={21} /></div><div><strong>ROUBAIX STORIES</strong><span>AI STUDIO</span></div></div>
        <div className="workspace-label">ESPACE DE TRAVAIL</div>
        <nav>
          <a className="nav-item active"><LayoutDashboard size={17} /> Vue générale</a>
          <a className="nav-item"><Workflow size={17} /> Agents IA</a>
          <a className="nav-item"><GitBranch size={17} /> Projet & fichiers</a>
          <a className="nav-item"><Activity size={17} /> Activité</a>
        </nav>
        <div className="sidebar-bottom"><div className="secure"><LockKeyhole size={16}/><span>Clés API protégées<br/><b>Configuration serveur à venir</b></span></div><div className="version">BUILD 0.1.0 · FOUNDATION</div></div>
      </aside>

      <section className="main">
        <header className="topbar"><div><span className="eyebrow">WORKSPACE / ROUBAIX STORIES</span><h1>Centre de commandement</h1></div><div className="top-status"><span className="status-dot"/> Interface initialisée <span className="avatar">RS</span></div></header>

        <section className="hero">
          <div className="hero-copy"><div className="pill"><span className="status-dot"/> PHASE 01 · FONDATIONS</div><h2>Construisons Roubaix,<br/><em>intelligemment.</em></h2><p>Un espace central pour coordonner les IA, concevoir le jeu et suivre chaque décision du projet.</p></div>
          <div className="hero-art"><div className="orb orb-one"/><div className="orb orb-two"/><div className="hero-core"><BrainCircuit size={54}/><span>AI CORE</span></div><div className="orbit orbit-a"/><div className="orbit orbit-b"/></div>
          <div className="hero-foot"><span><ShieldCheck size={15}/> Validation humaine avant modification du code</span><span><Gauge size={15}/> Budget API : 0 € / mois</span></div>
        </section>

        <div className="section-heading"><div><span className="eyebrow">ÉQUIPE VIRTUELLE</span><h3>Les spécialistes</h3></div><span className="count">06 RÔLES CONFIGURÉS</span></div>
        <section className="agent-grid">{agents.map((agent) => { const Icon = agent.icon; return <article className="agent-card" key={agent.name}><div className={`agent-icon ${agent.color}`}><Icon size={20}/></div><div className="agent-meta"><strong>{agent.name}</strong><span>{agent.role}</span></div><p>{agent.description}</p><div className="agent-state"><span className="state-dot"/> Rôle défini · IA non connectée</div></article>; })}</section>

        <section className="bottom-grid">
          <article className="panel task-panel"><div className="panel-title"><div><span className="eyebrow">ORCHESTRATEUR</span><h3>Nouvel objectif</h3></div><BrainCircuit size={20}/></div><p>Décris ce que tu veux construire. Le directeur IA pourra ensuite analyser et répartir le travail lorsque le backend sera activé.</p><textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Ex. : concevoir le quartier de l'Alma avec ses rues, bâtiments et points d'intérêt…"/><button onClick={() => setNotice(goal.trim() ? "Objectif enregistré dans cette interface de démonstration. L'envoi aux IA sera disponible après activation du backend." : "Écris d'abord un objectif pour le projet.")}><Play size={15}/> Préparer l'objectif</button></article>
          <article className="panel status-panel"><div className="panel-title"><div><span className="eyebrow">ÉTAT DU SYSTÈME</span><h3>Fondations</h3></div><Activity size={20}/></div><div className="check-row"><span className="check">✓</span><div><b>Interface React</b><small>Structure du tableau de bord</small></div><span className="tag done">PRÊT</span></div><div className="check-row"><span className="check">✓</span><div><b>Dépôt GitHub</b><small>Code source centralisé</small></div><span className="tag done">PRÊT</span></div><div className="check-row"><span className="pending">○</span><div><b>Serveur sécurisé</b><small>Gestion des clés API</small></div><span className="tag wait">À FAIRE</span></div><div className="check-row"><span className="pending">○</span><div><b>Agents connectés</b><small>OpenRouter + Gemini</small></div><span className="tag wait">À FAIRE</span></div></article>
        </section>
        <div className="notice"><LockKeyhole size={16}/><span>{notice}</span></div>
        <ApiSettings />
        <footer>ROUBAIX STORIES AI STUDIO <span>·</span> PRIVATE WORKSPACE <span>·</span> 2026</footer>
      </section>
    </main>
  );
}
