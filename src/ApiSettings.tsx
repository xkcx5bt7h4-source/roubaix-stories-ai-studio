import { useState } from "react";

type Health = { ok: boolean; providers?: { gemini: boolean; openrouter: boolean } };

export default function ApiSettings() {
  const [token, setToken] = useState("");
  const [provider, setProvider] = useState<"gemini" | "openrouter">("gemini");
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("Serveur non vérifié");
  const [busy, setBusy] = useState(false);

  async function checkServer() {
    try {
      const response = await fetch("/api/health");
      const data = await response.json() as Health;
      if (!response.ok) throw new Error("API indisponible");
      setStatus(`Serveur actif · Gemini ${data.providers?.gemini ? "configuré" : "à configurer"} · OpenRouter ${data.providers?.openrouter ? "configuré" : "à configurer"}`);
    } catch {
      setStatus("Serveur non joignable : vérifie que les deux services démarrent.");
    }
  }

  async function sendMessage() {
    if (!token.trim() || !message.trim()) {
      setAnswer("Ajoute le code d'accès du studio et un message.");
      return;
    }
    setBusy(true);
    setAnswer("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-studio-token": token },
        body: JSON.stringify({ provider, message, system: "Tu es le DÉVELOPPEUR PRINCIPAL du jeu vidéo ROUBAIX STORIES. Tu n'es PAS un assistant de communication ou un guide touristique. Ta mission est de CONSTRUIRE LE JEU en produisant du vrai code exécutable.\n\nCONTEXTE TECHNIQUE :\n- Projet de jeu web compatible navigateur, Mac M1 avec 8 Go de RAM.\n- Priorité aux technologies gratuites et légères : TypeScript, Vite et Babylon.js (ou une technologie web pertinente si le projet existant impose autre chose).\n- Budget API : 0 € par mois. Ne propose jamais de service payant.\n- Respecte les fichiers et technologies déjà présents dans le dépôt. Ne prétends jamais avoir modifié un fichier si tu n'as pas réellement accès à son écriture.\n\nRÈGLES DE TRAVAIL :\n1. Transforme chaque demande en fonctionnalité concrète du jeu.\n2. Commence par identifier les fichiers à créer ou modifier et leur rôle.\n3. Fournis le code COMPLET de chaque fichier nécessaire, avec son chemin exact. Pas de pseudo-code, pas de simples idées.\n4. Le code doit être cohérent avec le projet existant, compilable et sans dépendance payante.\n5. Ajoute les étapes précises pour intégrer et tester le code.\n6. Si une information manque, pose une seule question ciblée ou annonce clairement ton hypothèse.\n7. Pour une grosse fonctionnalité, avance par étapes testables et livre d'abord une première version jouable.\n8. Ne réponds pas par une présentation de ROUBAIX STORIES, une description touristique ou des généralités. Ne te contente pas de dire ce que tu pourrais faire : PRODUIS LE CODE.\n\nFORMAT OBLIGATOIRE :\n- Objectif technique\n- Fichiers à créer/modifier\n- Code complet par fichier (dans des blocs de code)\n- Installation / lancement\n- Tests à effectuer\n- Limites ou prochaine étape\n\nTu dois agir comme un ingénieur gameplay et développeur senior. Réponds en français, de façon directe et technique." })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur serveur");
      setAnswer(data.text || "(Réponse vide)");
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" style={{ marginTop: 22 }}>
      <div className="panel-title"><div><span className="eyebrow">ENVIRONNEMENT DE DÉVELOPPEMENT</span><h3>Développeur IA du jeu</h3></div></div>
      <p>Gemini est configuré pour agir comme développeur du jeu : il doit fournir du code complet, des chemins de fichiers et des étapes de test. Les clés restent côté serveur.</p>
      <div style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>Code d'accès du studio
          <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="STUDIO_ACCESS_TOKEN" autoComplete="off" />
        </label>
        <label style={{ display: "grid", gap: 6 }}>Fournisseur
          <select value={provider} onChange={e => setProvider(e.target.value as "gemini" | "openrouter")}>
            <option value="gemini">Gemini</option>
            <option value="openrouter">OpenRouter (gratuit uniquement)</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: 6 }}>Instruction de développement
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Ex. : crée le déplacement du personnage avec clavier, caméra et collisions…" />
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" onClick={checkServer}>Vérifier le serveur</button>
          <button type="button" onClick={sendMessage} disabled={busy}>{busy ? "Envoi…" : "Générer du code"}</button>
        </div>
        <small aria-live="polite">{status}</small>
        {answer && <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", padding: 14, borderRadius: 10, background: "rgba(127,127,127,.12)" }}>{answer}</pre>}
      </div>
    </section>
  );
}
