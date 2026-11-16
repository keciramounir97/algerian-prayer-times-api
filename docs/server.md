# Documentation Ligne par Ligne : `server.js`

Ce fichier est le point d'entrée principal de l'application. Il configure le serveur HTTP Express, les middlewares de sécurité et de parsing, les routes d'API REST pour les wilayas et les prières, la gestion des erreurs 404/500, ainsi que le démarrage conditionnel du serveur.

---

## Code source et explication détaillée ligne par ligne

```javascript
1: // =====================================================================
2: //  SERVEUR EXPRESS — API مواقيت الصلاة (méthode algérienne)
3: // =====================================================================
```
- **Lignes 1-3** : En-tête descriptif du serveur Express.

```javascript
5: import express from "express";
6: import cors from "cors";
7: import { fileURLToPath } from "node:url";
8: import wilayas from "./data/wilayas.js";
9: import { calculateMonth, calculatePrayerTimes, getNextPrayer } from "./utils/prayers.js";
```
- **Ligne 5** : Importation du framework web Express.
- **Ligne 6** : Importation du middleware `cors` (*Cross-Origin Resource Sharing*) permettant aux applications frontend (React, Vue, mobile, fetch client) hébergées sur d'autres domaines d'appeler cette API.
- **Ligne 7** : Importation de l'utilitaire Node.js `fileURLToPath` pour vérifier si le fichier est exécuté directement en CLI ou importé par un test.
- **Ligne 8** : Importation de la liste des 58 wilayas d'Algérie et des circonscriptions administratives déléguées.
- **Ligne 9** : Importation des fonctions de calcul de prière depuis `utils/prayers.js`.

```javascript
11: const app = express();
12: const PORT = process.env.PORT || 5000;
```
- **Ligne 11** : Instanciation de l'application Express.
- **Ligne 12** : Attribution du port d'écoute. Utilise la variable d'environnement `process.env.PORT` (utilisée en production, ex: Docker, Heroku, Railway) ou le port par défaut `5000`.

```javascript
14: // ---- Middlewares ----
15: app.use(cors());
16: app.use(express.json());
```
- **Ligne 15** : Active CORS sur toutes les routes.
- **Ligne 16** : Active le parseur JSON intégré d'Express pour décoder automatiquement le corps des requêtes HTTP avec `Content-Type: application/json`.

---

### Fonction `normalizeText(text)` & `findWilaya(query)`

```javascript
21: function normalizeText(text) {
22:   return String(text)
23:     .trim()
24:     .toLowerCase()
25:     .normalize("NFD")
26:     .replace(/[\u0300-\u036f]/g, ""); // Retire les accents
27: }
```
- **Lignes 21-27** : Fonction de normalisation textuelle. Convertit en chaîne, supprime les espaces périphériques, met en minuscules, décompose les caractères accentués en forme NFD et supprime les marques diacritiques Unicode. Exemple : `"Béjaïa"` $\to$ `"bejaia"`.

```javascript
29: export function findWilaya(query) {
30:   if (query === undefined || query === null) return null;
31:   const raw = String(query).trim();
32:   const num = Number(raw);
```
- **Lignes 29-32** : Résout une wilaya à partir d'un identifiant souple (code ou nom). Si l'entrée est vide, retourne `null`.

```javascript
34:   // Recherche directe par code numérique
35:   if (!isNaN(num) && num > 0) {
36:     const foundByCode = wilayas.find((w) => w.code === num);
37:     if (foundByCode) return foundByCode;
38:   }
```
- **Lignes 34-38** : Tente en priorité une recherche par code numérique (`w.code === num`). Résout par exemple `16` $\to$ Alger, `31` $\to$ Oran.

```javascript
40:   // Recherche par code avec padding "01" ou par nom (français ou arabe)
41:   const normalizedQuery = normalizeText(raw);
42:   return wilayas.find((w) => {
43:     return (
44:       String(w.code) === raw ||
45:       String(w.code).padStart(2, "0") === raw ||
46:       normalizeText(w.name) === normalizedQuery ||
47:       w.name_ar === raw
48:     );
49:   }) || null;
50: }
```
- **Lignes 40-50** : Si ce n'est pas un code simple, teste le code formaté à deux chiffres (`"01"`), le nom français sans accents ni casse (`"alger"`, `"oran"`), ou le nom officiel en arabe (`"الجزائر"`). Si aucune wilaya ne correspond, retourne `null`.

---

### Route `GET /` (Accueil et documentation API)

```javascript
55: app.get("/", (req, res) => {
56:   res.json({
57:     name: "Algerian Prayer Times API",
58:     name_ar: "مواقيت الصلاة في الجزائر",
59:     version: "1.1.0",
60:     method: "Méthode Algérienne (Ministère des Affaires Religieuses, 18°/17°)",
61:     status: "online",
62:     endpoints: { ... },
63:     examples: [ ... ],
64:   });
65: });
```
- **Lignes 55-80** : Route racine renvoyant un descriptif complet de l'API en JSON, son état de fonctionnement, et des exemples de requêtes prêts à l'emploi.

---

### Route `GET /api/health` (Contrôle d'état)

```javascript
85: app.get("/api/health", (req, res) => {
86:   res.json({
87:     status: "ok",
88:     uptimeSeconds: Math.floor(process.uptime()),
89:     timestamp: new Date().toISOString(),
90:   });
91: });
```
- **Lignes 85-91** : Endpoint de healthcheck retournant le statut `ok`, le temps d'activité du processus Node en secondes (`process.uptime()`) et l'horodatage actuel.

---

### Route `GET /api/wilayas` (Liste et filtrage)

```javascript
96: app.get("/api/wilayas", (req, res) => {
97:   const { q } = req.query;
98:   if (!q) {
99:     return res.json(wilayas);
100:   }
```
- **Lignes 96-100** : Si aucun paramètre de recherche `?q=` n'est passé, retourne l'intégralité du tableau des wilayas.

```javascript
102:   const queryNorm = normalizeText(q);
103:   const filtered = wilayas.filter((w) => {
104:     return (
105:       String(w.code) === q.trim() ||
106:       String(w.code).padStart(2, "0") === q.trim() ||
107:       normalizeText(w.name).includes(queryNorm) ||
108:       (w.name_ar && w.name_ar.includes(q.trim()))
109:     );
110:   });
111: 
112:   res.json(filtered);
113: });
```
- **Lignes 102-113** : Si `?q=` est spécifié, filtre la liste par correspondance partielle sur le code, le nom en français insensible aux accents ou le nom en arabe.

---

### Route `GET /api/wilayas/:code` (Détails d'une wilaya)

```javascript
118: app.get("/api/wilayas/:code", (req, res) => {
119:   const wilaya = findWilaya(req.params.code);
120:   if (!wilaya) {
121:     return res.status(404).json({
122:       error: `Wilaya '${req.params.code}' introuvable.`,
123:     });
124:   }
125:   res.json(wilaya);
126: });
```
- **Lignes 118-126** : Récupère les informations géographiques d'une wilaya (code, nom, nom_ar, latitude, longitude) via `findWilaya`. Retourne une erreur HTTP 404 si elle n'existe pas.

---

### Route `GET /api/today/:code` (Horaires du jour et prochaine prière)

```javascript
131: app.get("/api/today/:code", (req, res) => {
132:   try {
133:     const wilaya = findWilaya(req.params.code);
134:     if (!wilaya) {
135:       return res.status(404).json({
136:         error: `Wilaya '${req.params.code}' introuvable.`,
137:       });
138:     }
```
- **Lignes 131-138** : Vérifie l'existence de la wilaya demandée dans l'URL.

```javascript
140:     const now = new Date();
141:     const year = now.getFullYear();
142:     const month = now.getMonth() + 1;
143:     const day = now.getDate();
144:     const dateFormatted = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
```
- **Lignes 140-144** : Récupère la date locale de la machine et la formate en `YYYY-MM-DD`.

```javascript
146:     const times = calculatePrayerTimes({
147:       year,
148:       month,
149:       day,
150:       latitude: wilaya.lat,
151:       longitude: wilaya.lng,
152:     });
153: 
154:     const nextInfo = getNextPrayer(times, now);
```
- **Lignes 146-154** : Calcule les 6 horaires du jour pour les coordonnées GPS de la wilaya, puis détermine la prière en cours, la prochaine prière et le temps restant.

```javascript
156:     res.json({
157:       wilaya: {
158:         code: wilaya.code,
159:         name: wilaya.name,
160:         name_ar: wilaya.name_ar,
161:         lat: wilaya.lat,
162:         lng: wilaya.lng,
163:       },
164:       date: dateFormatted,
165:       times,
166:       currentPrayer: nextInfo.current,
167:       nextPrayer: nextInfo.next,
168:       remainingMinutes: nextInfo.remainingMinutes,
169:       remainingFormatted: nextInfo.remainingFormatted,
170:     });
171:   } catch (err) {
172:     res.status(500).json({ error: err.message });
173:   }
174: });
```
- **Lignes 156-174** : Répond avec l'objet enrichi complet. En cas d'exception inattendue, capture l'erreur et retourne un statut HTTP 500.

---

### Route `GET /api/next/:code` (Compte à rebours direct)

```javascript
179: app.get("/api/next/:code", (req, res) => {
180:   try {
181:     const wilaya = findWilaya(req.params.code);
182:     if (!wilaya) {
183:       return res.status(404).json({
184:         error: `Wilaya '${req.params.code}' introuvable.`,
185:       });
186:     }
...
205:     res.json({
206:       wilaya: {
207:         code: wilaya.code,
208:         name: wilaya.name,
209:         name_ar: wilaya.name_ar,
210:       },
211:       ...nextInfo,
212:     });
```
- **Lignes 179-216** : Fournit une réponse ciblée pour les widgets et interfaces mobiles qui n'ont besoin que de la prière active, de la suivante et du timer de compte à rebours.

---

### Route `GET /api/prayer-times/:code` (Calendrier mensuel)

```javascript
221: app.get("/api/prayer-times/:code", (req, res) => {
222:   try {
223:     const wilaya = findWilaya(req.params.code);
224:     if (!wilaya) {
225:       return res.status(404).json({ error: `Wilaya '${req.params.code}' introuvable.` });
226:     }
227: 
228:     const today = new Date();
229:     const month = parseInt(req.query.month, 10) || today.getMonth() + 1;
230:     const year = parseInt(req.query.year, 10) || today.getFullYear();
```
- **Lignes 221-230** : Extrait `month` et `year` depuis les paramètres de requête (`query string`), avec repli sur le mois et l'année courants si omis.

```javascript
232:     // Validation des paramètres
233:     if (isNaN(month) || month < 1 || month > 12) {
234:       return res.status(400).json({ error: "Mois invalide (doit être compris entre 1 et 12)" });
235:     }
236:     if (isNaN(year) || year < 1900 || year > 2100) {
237:       return res.status(400).json({ error: "Année invalide (doit être comprise entre 1900 et 2100)" });
238:     }
```
- **Lignes 232-238** : Valide rigoureusement les bornes temporelles pour rejeter les valeurs aberrantes (HTTP 400).

```javascript
240:     // Filtrage optionnel par jour précis (?day=)
241:     if (req.query.day) {
242:       const day = parseInt(req.query.day, 10);
243:       const daysInMonth = new Date(year, month, 0).getDate();
244:       if (isNaN(day) || day < 1 || day > daysInMonth) {
245:         return res.status(400).json({
246:           error: `Jour invalide pour le mois ${month}/${year} (1-${daysInMonth})`,
247:         });
248:       }
...
270:       return res.json({ ... });
271:     }
```
- **Lignes 240-271** : Permet au client de demander un jour précis du mois via `?day=X`. Vérifie le nombre réel de jours dans ce mois précis avant de retourner le résultat.

```javascript
273:     const days = calculateMonth({
274:       year,
275:       month,
276:       latitude: wilaya.lat,
277:       longitude: wilaya.lng,
278:     });
279: 
280:     res.json({
281:       wilaya: { ... },
282:       month,
283:       year,
284:       method: "Algérienne (Ministère des Affaires Religieuses, 18°/17°)",
285:       totalDays: days.length,
286:       days,
287:     });
```
- **Lignes 273-291** : Génère le tableau complet des 28 à 31 jours du mois avec métadonnées méthodologiques.

---

### Middlewares de gestion des erreurs (404 et 500)

```javascript
296: app.use((req, res) => {
297:   res.status(404).json({
298:     error: `Route ${req.method} ${req.url} non trouvée.`,
299:     availableEndpoints: [ ... ],
300:   });
301: });
```
- **Lignes 296-313** : Middleware 404 personnalisé capturant toute requête dirigée vers une route non définie et retournant une aide au format JSON.

```javascript
318: app.use((err, req, res, next) => {
319:   console.error("Erreur non interceptée :", err);
320:   res.status(500).json({
321:     error: "Erreur interne du serveur",
322:     message: err.message,
323:   });
324: });
```
- **Lignes 318-324** : Middleware global de traitement d'erreurs Express recevant les 4 arguments `(err, req, res, next)`.

---

### Démarrage conditionnel du serveur & Exports ESM

```javascript
327: const isDirectRun =
328:   Boolean(process.argv[1]) &&
329:   fileURLToPath(import.meta.url).toLowerCase() === process.argv[1].toLowerCase();
330: 
331: let server;
332: if (isDirectRun) {
333:   server = app.listen(PORT, () => {
334:     console.log(`🚀 API مواقيت الصلاة prête sur http://localhost:${PORT}`);
335:   });
336: }
337: 
338: export { app, server };
```
- **Lignes 327-338** :
  - `isDirectRun` : Compare le chemin du fichier exécuté en CLI (`process.argv[1]`) avec l'URL de ce module (`import.meta.url`).
  - Si le fichier est lancé directement (`node server.js`), le serveur démarre et écoute sur le port configuré.
  - S'il est importé par un fichier de tests (`test.js`), l'instance `app` est exportée sans lancer d'écoute sur le port 5000, évitant tout conflit de port (*EADDRINUSE*).
