# Documentation de Déploiement : Vercel Serverless

Ce document décrit la configuration mise en place pour déployer l'application Express en architecture serverless sur **Vercel**.

---

## 1. URL de Production

- **URL principale (Production)** : [`https://algerian-prayer-times.vercel.app`](https://algerian-prayer-times.vercel.app)
- **Hébergeur** : Vercel (Région CDG1 / Paris & IAD1 / Washington)
- **Environnement d'exécution** : Node.js (ESM)

---

## 2. Fichiers de Configuration Vercel

### A. `server.js` (Export par Défaut)
Pour être compatible avec le runtime serverless de Vercel qui détecte automatiquement Express, `server.js` exporte l'instance Express comme export par défaut :
```javascript
export default app;
export { app, server };
```

### B. `api/index.js` (Point d'Entrée Serverless)
Sert de pont pour router les requêtes HTTP vers l'application Express :
```javascript
import { app } from "../server.js";

export default app;
```

### C. `vercel.json` (Règles de Réécriture)
Redirige toutes les requêtes entrantes vers la fonction serverless :
```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/index.js"
    }
  ]
}
```

---

## 3. Commandes `curl` Testées et Validées en Direct

Toutes ces commandes sont prêtes à être exécutées dans votre terminal **Git Bash** :

```bash
# 1. Accueil & documentation
curl -s https://algerian-prayer-times.vercel.app/

# 2. Statut & Healthcheck
curl -s https://algerian-prayer-times.vercel.app/api/health

# 3. Horaires du jour pour Alger (16)
curl -s https://algerian-prayer-times.vercel.app/api/today/16

# 4. Prochaine prière et compte à rebours pour Oran (31)
curl -s https://algerian-prayer-times.vercel.app/api/next/31

# 5. Calendrier complet du mois pour Constantine (25)
curl -s "https://algerian-prayer-times.vercel.app/api/prayer-times/25?month=11&year=2026"
```
