# Documentation Globale : API des Horaires de Prière en Algérie

Bienvenue dans la documentation technique complète de l'application **Algerian Prayer Times API** (`prayer-times-api`), développée en **Node.js (ESM)** et **Express**.

Ce document présente l'architecture globale, les fondements mathématiques et astronomiques, l'historique du développement, ainsi que l'index de tous les fichiers du projet documentés ligne par ligne.

---

## 1. Index de la Documentation par Fichier

Chaque fichier du projet dispose d'une documentation dédiée expliquant son rôle et son code ligne par ligne :

| Fichier Source | Documentation Ligne par Ligne | Description |
|---|---|---|
| `server.js` | [docs/server.md](server.md) | Serveur Express, middlewares, routes REST, résolveur de wilayas et gestion d'erreurs |
| `config/algeria.js` | [docs/config-algeria.md](config-algeria.md) | Constantes officielles (18°/17°), école Malékite, UTC+1 et ajustements du Ministère |
| `data/wilayas.js` | [docs/data-wilayas.md](data-wilayas.md) | Base géographique des 58 wilayas d'Algérie et 11 circonscriptions déléguées |
| `utils/astronomy.js` | [docs/utils-astronomy.md](utils-astronomy.md) | Formules de Jean Meeus : Jour Julien, position du soleil, équation du temps, midi solaire |
| `utils/prayers.js` | [docs/utils-prayers.md](utils-prayers.md) | Calcul des 5 prières, règle de repli du 1/7ᵉ, calendrier mensuel et prochaine prière |
| `package.json` | [docs/package-json.md](package-json.md) | Manifeste npm, dépendances, configuration ESM et scripts d'exécution |
| `test.js` | [docs/test.md](test.md) | Suite de 25 tests unitaires et d'intégration HTTP |
| `docs/vercel.md` | [docs/vercel.md](vercel.md) | Déploiement serverless sur Vercel, alias de domaine et commandes curl |
| `docs/change1.md` | [docs/change1.md](change1.md) | Rapport de débogage et résolution des 5 bugs critiques |
| `docs/change2.md` | [docs/change2.md](change2.md) | Rapport des nouvelles fonctionnalités et améliorations architecturales |

---

## 2. Comment l'Application Fonctionne

L'application calcule les horaires de prière de manière **autonome et locale**, sans faire appel à des API tierces externes. Le flux de traitement suit les étapes suivantes :

```
[Requête Client HTTP]
         │
         ▼
[server.js] ────────► Normalisation & Résolution de la Wilaya (findWilaya)
         │                     │
         │                     ▼
         │             [data/wilayas.js] (Extraction latitude, longitude)
         ▼
[utils/prayers.js] ──► calculatePrayerTimes({ year, month, day, lat, lng })
         │                     │
         │                     ▼
         │             [config/algeria.js] (Paramètres 18°/17°, Asr factor 1)
         │                     │
         │                     ▼
         │             [utils/astronomy.js]
         │               1. Jour Julien (julianDay)
         │               2. Déclinaison et Équation du temps (sunPosition)
         │               3. Midi Solaire Vrai (solarNoon)
         │               4. Angles horaires (hourAngle)
         │                     │
         │                     ▼
         │             Application des ajustements officiels (+1m Dhuhr, +1m Maghrib)
         ▼
[getNextPrayer] ─────► Détermination de la prière courante, suivante & compte à rebours
         │
         ▼
[Réponse HTTP JSON enrichie]
```

---

## 3. Fondements Scientifiques & Islamiques

### A. La convention du Ministère des Affaires Religieuses et des Wakfs (Algérie)
1. **Fajr (Aube)** : Le soleil se trouve à **$-18.0^\circ$** sous l'horizon géométrique.
2. **Chourouk (Lever du Soleil)** : Le bord supérieur du soleil apparaît à l'horizon, correspondant à une altitude du centre solaire de **$-0.833^\circ$** (tenant compte de la réfraction atmosphérique et du rayon apparent).
3. **Dhuhr (Midi)** : Moment où le soleil quitte le méridien local (*Zawal*), avec un ajustement d'**+1 minute** de précaution canonique.
4. **Asr (Après-midi)** : Selon l'école **Malékite**, lorsque la longueur de l'ombre d'un objet vertical est égale à sa propre taille augmentée de l'ombre au zénith ($\text{facteur} = 1$).
5. **Maghrib (Coucher du Soleil)** : Disparition complète du disque solaire sous l'horizon (altitude $-0.833^\circ$) avec **+1 minute** de précaution avant l'Adhan.
6. **Isha (Nuit)** : Disparition du crépuscule rouge, correspondant à un angle de **$-17.0^\circ$** sous l'horizon.

### B. Formules Astronomiques de Jean Meeus
- **Jour Julien ($JD$)** :
  $$JD = \lfloor 365.25(Y + 4716) \rfloor + \lfloor 30.6001(M + 1) \rfloor + D + B - 1524.5$$
- **Midi Solaire Vrai ($T_{\text{midi}}$)** :
  $$T_{\text{midi}} = 12 - \frac{\text{Longitude}}{15} + \text{Timezone} - \frac{\text{Équation du Temps}}{60}$$
- **Angle Horaire ($H$)** :
  $$\cos(H) = \frac{\sin(\alpha) - \sin(\phi)\sin(\delta)}{\cos(\phi)\cos(\delta)}$$

---

## 4. Historique du Développement et Débogage

L'application a été initialement conçue comme une API Express pour le calcul des horaires en Algérie, mais comportait plusieurs défauts majeurs l'empêchant de fonctionner :
1. Une faute de frappe dans `config/algeria.js` (`adjustements`) causait un crash 500 dès l'exécution de tout calcul.
2. Une inversion de signe dans l'équation du temps (`+` au lieu de `-`) faussait tous les horaires de prières d'environ une demi-heure.
3. Une erreur de type dans la capture de paramètres Express (`===`) empêchait de trouver les wilayas via leur code d'URL.
4. La prière de Dhuhr subissait un double ajustement non souhaité.

Toutes ces anomalies ont été résolues, et le projet a été complété par un moteur de compte à rebours, une gestion des erreurs 404/500, le support des variables d'environnement, et une suite de tests automatisés à 100% de réussite.

---

## 5. Démarrage et Utilisation Rapide

### Installation
```bash
npm install
```

### Exécution des Tests
```bash
npm test
```

### Démarrage en Mode Développement
```bash
npm run dev
```

### Démarrage en Production
```bash
npm start
```
Le serveur sera disponible sur `http://localhost:5000`.
