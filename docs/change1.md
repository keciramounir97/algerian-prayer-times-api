# Change 1: Debugging & Core Bug Fixes

Ce document détaille l'ensemble des anomalies critiques identifiées et corrigées dans le backend de calcul des horaires de prière en Algérie (`prayer-times-api`).

---

## 1. Résumé des Anomalies Détectées

| N° | Composant | Fichier | Type de Bug | Impact |
|---|---|---|---|---|
| **1** | Configuration | `config/algeria.js` vs `utils/prayers.js` | Erreur de nommage de propriété (`adjustements` vs `adjustments`) | `TypeError: Cannot read properties of undefined` sur chaque calcul (crash HTTP 500) |
| **2** | Algorithme Astronomique | `utils/astronomy.js` (`solarNoon`) | Inversion de signe dans l'Équation du Temps ($+$ au lieu de $-$) | Tous les horaires de prière étaient faussés d'environ **30 minutes** |
| **3** | Routing Express | `server.js` (`req.params.code`) | Égalité stricte sur types incompatibles (`number` vs `string`) | Toutes les requêtes `/api/today/:code` et `/api/prayer-times/:code` retournaient `404 Wilaya introuvable` |
| **4** | Double Ajustement Dhuhr | `utils/prayers.js` | Ajustement de Dhuhr compté 2 fois (+1 min en dur + 1 min config) | Prière de Dhuhr décalée de 2 minutes au lieu d'1 minute |
| **5** | Date & Fuseau Horaire | `server.js` (`/api/today/:code`) | Désynchronisation entre `now.toISOString()` (UTC) et `now.getDate()` (local) | Risque de date incohérente lors des requêtes passées entre 23h et minuit |

---

## 2. Détail des Corrections

### Bug 1 : Crash `TypeError: Cannot read properties of undefined (reading 'fajr')`

- **Cause racine** : 
  Dans `config/algeria.js`, la clé de configuration était orthographiée avec une coquille linguistique française :
  ```javascript
  // AVANT (config/algeria.js)
  adjustements: {
    fajr: 0,
    sunrise: 0,
    dhuhr: 1,
    asr: 0,
    maghrib: 1,
    isha: 0,
  }
  ```
  Tandis que `utils/prayers.js` tentait d'accéder à `cfg.adjustments.fajr`. En JavaScript, `cfg.adjustments` valait `undefined`, provoquant un crash immédiat lors de la lecture de la sous-propriété `fajr`.

- **Correction apportée** :
  1. Renommage de la propriété en `adjustments` dans `config/algeria.js`.
  2. Ajout d'un getter rétrocompatible `adjustements` pour éviter toute rupture si du code tiers l'utilise.
  3. Sécurisation défensive dans `utils/prayers.js` :
     ```javascript
     const adjustments = cfg.adjustments || cfg.adjustements || {};
     ```

---

### Bug 2 : Erreur astronomique majeure sur l'Équation du Temps

- **Cause racine** :
  La formule astronomique de calcul du midi solaire vrai (Jean Meeus) relie le temps solaire vrai au temps solaire moyen par l'Équation du Temps ($E$) :
  $$\text{Temps Moyen} = \text{Temps Vrai} - E$$
  À midi solaire vrai, le temps solaire vrai vaut exactement $12\text{h}$.
  Le passage au méridien local en heure civile s'exprime donc par :
  $$T_{\text{midi}} = 12 - \frac{\text{Longitude}}{15} + \text{Timezone} - \frac{E}{60}$$
  
  Dans `utils/astronomy.js`, la ligne contenait un signe $+$ erroné :
  ```javascript
  // AVANT (utils/astronomy.js)
  export function solarNoon(jd, longitude, timezone) {
    return 12 - longitude / 15 + timezone + sunPosition(jd).eqTime / 60; // ERREUR : + au lieu de -
  }
  ```
  
- **Impact concret** :
  À la mi-novembre, $E \approx +15.3\text{ minutes}$.
  - Le calcul erroné produisait : $12\text{h}48 + 15\text{m} = 13\text{h}03$ (+ décalage).
  - La valeur astronomique exacte est : $12\text{h}48 - 15\text{m} = 12\text{h}33$.
  Toutes les prières de la journée (Fajr, Chourouk, Dhuhr, Asr, Maghrib, Isha) étaient décalées de **~30 minutes** dans le futur par rapport aux horaires officiels de la république algérienne.

- **Correction apportée** :
  ```javascript
  // APRÈS (utils/astronomy.js)
  export function solarNoon(jd, longitude, timezone) {
    return 12 - longitude / 15 + timezone - sunPosition(jd).eqTime / 60;
  }
  ```
  De plus, la normalisation de la différence angulaire dans `sunPosition` a été fiabilisée :
  ```javascript
  const eqTime = 4 * normalize180(L0 - 0.0057183 - alpha);
  ```

---

### Bug 3 : Échec systématique de recherche de wilaya (`404 Wilaya introuvable`)

- **Cause racine** :
  Dans `server.js`, la comparaison utilisait l'opérateur d'égalité stricte `===` :
  ```javascript
  // AVANT (server.js)
  const { code } = req.params;
  const wilaya = wilayas.find((w) => w.code === code);
  ```
  Dans `data/wilayas.js`, les codes sont des entiers numériques (`1`, `2`, `16`, etc.).
  Or, les paramètres d'URL capturés par Express (`req.params.code`) sont obligatoirement des chaînes de caractères (`"16"` ou `"01"`).
  En JavaScript, `16 === "16"` s'évalue toujours à `false`. Aucun endpoint ciblant une wilaya par son code ne pouvait aboutir.

- **Correction apportée** :
  Remplacement de la comparaison stricte par une fonction dédiée `findWilaya(query)` qui gère :
  - Le code numérique direct (`Number(query)`)
  - Les chaînes numériques simples (`"16"`)
  - Les codes avec zéro de tête (`"01"` pour Adrar)
  - Les noms en français insensibles à la casse et aux accents (`"oran"`, `"bejaia"`)
  - Les noms officiels en arabe (`"الجزائر"`, `"وهران"`)

---

### Bug 4 : Double ajustement du Dhuhr

- **Cause racine** :
  Dans `utils/prayers.js` :
  - Ligne 91 : `let dhuhr = noon + 1 / 60; // +1 min par défaut`
  - Ligne 119 : `dhuhr = applyAdjustment(dhuhr, cfg.adjustments.dhuhr);`
  Comme `cfg.adjustments.dhuhr` est déjà configuré à `1`, l'addition s'effectuait deux fois, décalant le Dhuhr de 2 minutes après le zénith au lieu d'1 minute.

- **Correction apportée** :
  Initialisation propre de Dhuhr au midi solaire vrai (`let dhuhr = noon;`), laissant l'étape d'ajustement appliquer la minute officielle du ministère.

---

### Bug 5 : Incohérence de date en fin de journée (UTC vs Local)

- **Cause racine** :
  L'utilisation de `now.toISOString().slice(0, 10)` générait une date basée sur le temps universel coordonné (UTC). Pour l'Algérie (UTC+1), à minuit moins le quart (23h45), l'heure UTC correspondait encore au jour précédent, provoquant une anomalie entre les horaires calculés pour le jour local et le libellé de date retourné.

- **Correction apportée** :
  Formatage explicite à partir de l'année, du mois et du jour locaux :
  ```javascript
  const dateFormatted = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  ```
