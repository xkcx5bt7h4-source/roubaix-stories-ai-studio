# Backend sécurisé

- Les clés fournisseurs sont lues uniquement depuis les variables d'environnement du serveur.
- L'API est protégée par STUDIO_ACCESS_TOKEN (en-tête x-studio-token).
- Helmet ajoute des en-têtes de sécurité.
- Le JSON entrant est limité à 32 Ko et les requêtes IA sont limitées à 20 / 15 minutes.
- OpenRouter utilise exclusivement le routeur gratuit `openrouter/free`. Aucun fallback payant n'est configuré.
- Gemini ne fonctionne que si GEMINI_API_KEY et GEMINI_MODEL sont définis.

Routes :
- GET /api/health : état non sensible des fournisseurs configurés.
- POST /api/chat : nécessite x-studio-token et un corps { provider, message, system? }.

Ce backend de développement doit être déployé derrière HTTPS et un contrôle d'accès adapté avant toute exposition publique en production.
