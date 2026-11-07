# ROUBAIX STORIES AI STUDIO

Development workspace for the ROUBAIX STORIES project.

## Current phase
Phase 1 — browser dashboard foundation.

## Principles
- Monthly API budget: €0.
- Free models only; never silently fall back to paid models.
- API keys stay on the server and are never committed to Git.
- AI suggestions must be reviewed before project files are changed.
- The studio coordinates specialist roles; roles are not assumed to be separate model subscriptions.

## Planned architecture
- Frontend: React + TypeScript + Vite.
- Backend: Node.js API (to be added in the next phase).
- AI providers: OpenRouter free routes and Gemini free tier, subject to quotas and provider terms.
- Game technology: Babylon.js is the current candidate for the browser game; performance must be tested on the target Mac M1 with 8 GB RAM.

## Run the dashboard locally
```bash
npm install
npm run dev
```

The first version is a UI foundation only. AI calls are not enabled until the secure backend and server-side environment variables are implemented.
