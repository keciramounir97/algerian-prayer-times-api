# Change 2: New Features, Architecture & API Improvements

Ce document recense les nouvelles fonctionnalités, améliorations d'architecture et outils de tests ajoutés au projet.

---

## 1. Nouveaux Endpoints de l'API

| Méthode | Route | Description | Nouveauté |
|---|---|---|---|
| `GET` | `/` | Racine de l'API, page d'accueil JSON listant le statut, la version, la méthode officielle et des liens d'exemples. | **Nouveau** |
| `GET` | `/api/health` | Bilan de santé du serveur : statut opérationnel (`"ok"`), uptime en secondes, horodatage ISO. | **Nouveau** |
| `GET` | `/api/wilayas` | Liste des wilayas d'Algérie. Supporte désormais le paramètre de recherche `?q=` (ex: `?q=oran`, `?q=16`, `?q=قسنطينة`). | **Amélioré** |
| `GET` | `/api/wilayas/:code` | Fiche détaillée d'une wilaya spécifique par son code ou son nom. | **Nouveau** |
| `GET` | `/api/today/:code` | Horaires du jour enrichis : détails de la wilaya (avec nom en arabe), horaires, prière actuelle, prochaine prière et temps restant. | **Amélioré** |
| `GET` | `/api/next/:code` | Endpoint dédié fournissant instantanément la prière actuelle, la prochaine prière, et le compte à rebours précis en minutes et au format `"XXh YYm"`. | **Nouveau** |
| `GET` | `/api/prayer-times/:code` | Calendrier mensuel complet avec support de `?month=` et `?year=`. Accepte également le paramètre optionnel `?day=` pour cibler un jour précis. | **Amélioré** |

---

## 2. Détermination Intelligente de la Prochaine Prière (`getNextPrayer`)

Une nouvelle fonction utilitaire a été implémentée dans `utils/prayers.js` et intégrée aux routes `/api/today/:code` et `/api/next/:code`.

### Caractéristiques :
- **Identification automatique de la prière en cours et de la suivante** : Compare l'heure courante avec la séquence chronologique :
  $$\text{Fajr} \longrightarrow \text{Chourouk} \longrightarrow \text{Dhuhr} \longrightarrow \text{Asr} \longrightarrow \text{Maghrib} \longrightarrow \text{Isha}$$
- **Gestion du passage à minuit** : Si l'heure courante dépasse celle de l'Isha, la fonction identifie automatiquement que la prochaine prière est le **Fajr du lendemain** (`isTomorrow: true`) et calcule précisément le temps restant à travers minuit.
- **Compte à rebours prêt pour l'affichage Frontend** :
  - `remainingMinutes` : entier utilisable pour des barres de progression ou des timers JavaScript.
  - `remainingFormatted` : chaîne lisible (ex: `"01h 45m"`).

---

## 3. Système Flexible de Résolution des Wilayas (`findWilaya`)

La fonction `findWilaya` permet aux utilisateurs et aux développeurs front-end d'interroger l'API avec une grande tolérance :
1. **Code numérique** : `findWilaya(16)`
2. **Code sous forme de chaîne** : `findWilaya("16")`
3. **Code formaté à deux chiffres** : `findWilaya("01")`
4. **Nom en français (insensible à la casse)** : `findWilaya("oran")` ou `findWilaya("ORAN")`
5. **Nom avec accents normalisés** : `findWilaya("bejaia")` résout automatiquement `Béjaïa`
6. **Nom officiel en langue arabe** : `findWilaya("الجزائر")`, `findWilaya("تلمسان")`

---

## 4. Robustesse du Serveur & Gestion des Erreurs

- **Port configurable via variable d'environnement** :
  ```javascript
  const PORT = process.env.PORT || 5000;
  ```
- **Gestionnaire d'erreur 404 personnalisé** :
  Les requêtes vers des routes inconnues retournent une réponse JSON claire (statut HTTP 404) avec la liste des endpoints disponibles au lieu d'une page HTML Express brute.
- **Validation renforcée des paramètres** :
  - Vérification de la plage du mois : $1 \le \text{month} \le 12$.
  - Vérification de la plage de l'année : $1900 \le \text{year} \le 2100$.
  - Vérification des jours réels du mois (gère les années bissextiles pour février).
- **Middleware d'interception globale des erreurs 500** (`express error handler`).

---

## 5. Suite de Tests Automatisés (`test.js`)

Une suite complète de 25 tests automatisés a été mise en place avec le module natif `node:assert`, exécutable directement par :
```bash
npm test
```

### Couverture des tests :
1. **Astronomie & Formules de Meeus** :
   - Conformité du Jour Julien à l'époque standard J2000.
   - Cohérence de l'Équation du Temps et de la déclinaison solaire.
   - Exactitude du midi solaire pour Alger (~12h33 en novembre).
2. **Horaires de Prière (Méthode Algérienne)** :
   - Chronologie stricte : Fajr < Sunrise < Dhuhr < Asr < Maghrib < Isha.
   - Calcul des mois complets et gestion des années bissextiles (29 jours en février 2024, 30 jours en novembre).
   - Validation de la logique de compte à rebours et transition après l'Isha.
3. **Résolution des Wilayas** :
   - Recherche par entier, chaîne, format `01`, nom sans accent, nom arabe, et gestion des codes invalides (`null`).
4. **Validation des Endpoints HTTP** :
   - Tests réels sur serveur de test éphémère (port dynamique 0 sans conflit de port) validant les codes HTTP 200, 400 et 404.

---

## 6. Structure des Fichiers Modifiés et Ajoutés

```
backend/
├── config/
│   └── algeria.js          # [Modifié] Correction de l'orthographe adjustments + getter rétrocompatible
├── data/
│   └── wilayas.js          # [Inchangé] Données géographiques des wilayas
├── docs/
│   ├── change1.md          # [Nouveau] Documentation des corrections de bugs et calculs astronomiques
│   └── change2.md          # [Nouveau] Documentation des nouvelles fonctionnalités et de l'architecture
├── utils/
│   ├── astronomy.js        # [Modifié] Formule exacte du midi solaire et normalisation équation du temps
│   └── prayers.js          # [Modifié] Suppression du double ajustement Dhuhr, calcul getNextPrayer
├── package.json            # [Modifié] Ajout du script de test 'npm test' et métadonnées
├── server.js               # [Modifié] Refonte des routes, findWilaya, gestion d'erreurs, export ESM
└── test.js                 # [Nouveau] Suite de tests automatisés (25 tests unitaires et d'intégration)
```
