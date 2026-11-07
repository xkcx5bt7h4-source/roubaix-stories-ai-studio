import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { timingSafeEqual } from "node:crypto";

const app = express();
const PORT = Number(process.env.PORT || 3001);
const ACCESS_TOKEN = process.env.STUDIO_ACCESS_TOKEN || "";

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "32kb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Trop de requêtes. Réessaie dans quelques minutes." }
});

function hasValidStudioToken(req) {
  const supplied = req.get("x-studio-token") || "";
  if (!ACCESS_TOKEN || !supplied) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(ACCESS_TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

function requireStudioToken(req, res, next) {
  if (!ACCESS_TOKEN) {
    return res.status(503).json({ error: "Serveur non configuré : STUDIO_ACCESS_TOKEN manquant." });
  }
  if (!hasValidStudioToken(req)) {
    return res.status(401).json({ error: "Accès refusé. Vérifie le code d'accès du studio." });
  }
  next();
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "roubaix-stories-ai-studio",
    providers: {
      gemini: Boolean(process.env.GEMINI_API_KEY),
      openrouter: Boolean(process.env.OPENROUTER_API_KEY)
    }
  });
});

app.post("/api/chat", limiter, requireStudioToken, async (req, res) => {
  const { provider, message, system } = req.body ?? {};
  if (!["gemini", "openrouter"].includes(provider)) {
    return res.status(400).json({ error: "Fournisseur IA invalide." });
  }
  if (typeof message !== "string" || !message.trim() || message.length > 12000) {
    return res.status(400).json({ error: "Le message doit contenir entre 1 et 12 000 caractères." });
  }
  if (system !== undefined && (typeof system !== "string" || system.length > 4000)) {
    return res.status(400).json({ error: "Instruction système invalide ou trop longue." });
  }

  try {
    let response;
    let data;

    if (provider === "gemini") {
      const key = process.env.GEMINI_API_KEY;
      const model = process.env.GEMINI_MODEL;
      if (!key || !model) return res.status(503).json({ error: "Gemini n'est pas configuré sur le serveur." });

      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
            contents: [{ role: "user", parts: [{ text: message.trim() }] }]
          }),
          signal: AbortSignal.timeout(60000)
        }
      );
      data = await response.json();
      if (!response.ok) {
        console.error("Gemini provider error:", response.status);
        return res.status(502).json({ error: "Gemini a refusé la requête. Vérifie le modèle, la clé et le quota." });
      }
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
      return res.json({ ok: true, provider, model, text });
    }

    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return res.status(503).json({ error: "OpenRouter n'est pas configuré sur le serveur." });

    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_ORIGIN || "https://stackblitz.com",
        "X-Title": "ROUBAIX STORIES AI STUDIO"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: message.trim() }
        ],
        max_tokens: 1200
      }),
      signal: AbortSignal.timeout(60000)
    });
    data = await response.json();
    if (!response.ok) {
      console.error("OpenRouter provider error:", response.status);
      return res.status(502).json({ error: "OpenRouter ne peut pas répondre actuellement. Aucun modèle payant ne sera utilisé." });
    }
    return res.json({
      ok: true,
      provider,
      model: data.model || "openrouter/free",
      text: data.choices?.[0]?.message?.content || ""
    });
  } catch (error) {
    console.error("AI request failed:", error.name || "UnknownError");
    return res.status(504).json({ error: "Le fournisseur IA ne répond pas à temps. Réessaie plus tard." });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ROUBAIX STORIES API active sur le port ${PORT}`);
});
