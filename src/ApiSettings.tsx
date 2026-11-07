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
        body: JSON.stringify({ provider, message })
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
      <div className="panel-title"><div><span className="eyebrow">BACKEND SÉCURISÉ</span><h3>Connexion des IA</h3></div></div>
      <p>Les clés Gemini et OpenRouter seront stockées dans les variables secrètes du serveur, jamais dans cette interface.</p>
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
        <label style={{ display: "grid", gap: 6 }}>Message de test
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Écris un message pour tester le serveur…" />
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" onClick={checkServer}>Vérifier le serveur</button>
          <button type="button" onClick={sendMessage} disabled={busy}>{busy ? "Envoi…" : "Tester le modèle"}</button>
        </div>
        <small aria-live="polite">{status}</small>
        {answer && <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", padding: 14, borderRadius: 10, background: "rgba(127,127,127,.12)" }}>{answer}</pre>}
      </div>
    </section>
  );
}
