import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { timingSafeEqual } from "node:crypto";

function studioApi(env: Record<string, string>) {
  const attempts = new Map<string, { count: number; reset: number }>();

  return {
    name: "roubaix-stories-api",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = new URL(req.url || "/", "http://localhost");
        if (!url.pathname.startsWith("/api/")) return next();

        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-Content-Type-Options", "nosniff");

        if (url.pathname === "/api/health" && req.method === "GET") {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            ok: true,
            service: "roubaix-stories-ai-studio",
            providers: {
              gemini: Boolean(env.GEMINI_API_KEY && env.GEMINI_MODEL),
              openrouter: Boolean(env.OPENROUTER_API_KEY)
            }
          }));
          return;
        }

        if (url.pathname !== "/api/chat" || req.method !== "POST") {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }

        const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress || "unknown";
        const now = Date.now();
        const current = attempts.get(ip);
        if (!current || current.reset < now) attempts.set(ip, { count: 1, reset: now + 15 * 60 * 1000 });
        else if (current.count >= 20) {
          res.statusCode = 429;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Trop de requêtes. Réessaie dans quelques minutes." }));
          return;
        } else current.count++;

        const expected = env.STUDIO_ACCESS_TOKEN || "";
        const supplied = req.headers["x-studio-token"]?.toString() || "";
        const a = Buffer.from(supplied);
        const b = Buffer.from(expected);
        if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
          res.statusCode = expected ? 401 : 503;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: expected ? "Accès refusé. Vérifie le code d'accès du studio." : "Serveur non configuré : STUDIO_ACCESS_TOKEN manquant." }));
          return;
        }

        let raw = "";
        req.on("data", (chunk: Buffer) => {
          raw += chunk.toString();
          if (raw.length > 32 * 1024) req.destroy();
        });
        req.on("end", async () => {
          try {
            const body = JSON.parse(raw || "{}");
            const { provider, message, system } = body;
            if (!["gemini", "openrouter"].includes(provider) || typeof message !== "string" || !message.trim() || message.length > 12000 || (system !== undefined && (typeof system !== "string" || system.length > 4000))) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Requête invalide. Vérifie le fournisseur et le message." }));
              return;
            }

            let response: Response;
            let data: any;
            if (provider === "gemini") {
              const key = env.GEMINI_API_KEY;
              const model = env.GEMINI_MODEL;
              if (!key || !model) {
                res.statusCode = 503;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Gemini n'est pas configuré sur le serveur." }));
                return;
              }
              response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
                  contents: [{ role: "user", parts: [{ text: message.trim() }] }]
                }),
                signal: AbortSignal.timeout(60000)
              });
              data = await response.json();
              if (!response.ok) throw new Error("Gemini a refusé la requête. Vérifie le modèle, la clé et le quota.");
              const text = data.candidates?.[0]?.content?.parts?.map((part: any) => part.text || "").join("") || "";
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true, provider, model, text }));
              return;
            }

            const key = env.OPENROUTER_API_KEY;
            if (!key) {
              res.statusCode = 503;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "OpenRouter n'est pas configuré sur le serveur." }));
              return;
            }
            response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json",
                "HTTP-Referer": env.APP_ORIGIN || "https://stackblitz.com",
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
            if (!response.ok) throw new Error("OpenRouter ne peut pas répondre actuellement. Aucun modèle payant ne sera utilisé.");
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, provider, model: data.model || "openrouter/free", text: data.choices?.[0]?.message?.content || "" }));
          } catch (error: any) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: error?.message || "Erreur du fournisseur IA." }));
          }
        });
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), studioApi(env)],
    server: { host: "0.0.0.0" }
  };
});
