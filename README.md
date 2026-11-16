# 🕌 Algerian Prayer Times API

[![Node.js CI](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Method: Algeria](https://img.shields.io/badge/Method-18%C2%B0%20%2F%2017%C2%B0%20(Algeria)-emerald.svg)](#)

API REST rapide et autonome pour le calcul officiel des horaires de prière en Algérie (selon les directives du **Ministère des Affaires Religieuses et des Wakfs**).

Développée avec **Node.js (ESM)** et **Express**, elle n'utilise aucune dépendance externe ou API tierce pour le calcul : toutes les coordonnées solaires sont déterminées localement à l'aide des algorithmes astronomiques de haute précision de **Jean Meeus**.

---

## 🌟 Fonctionnalités

- 📍 **Couverture complète** : Les 58 wilayas d'Algérie + les 11 wilayas déléguées (69 localités) avec dénominations officielles bilingues (Français / Arabe).
- 📐 **Conformité officielle algérienne** :
  - Fajr : $-18.0^\circ$
  - Isha : $-17.0^\circ$
  - Asr : Facteur 1 (école Malékite)
  - Timezone : UTC+1 (fixe sans DST)
  - Précautions officielles : +1 min pour Dhuhr, +1 min pour Maghrib
- ⏱ **Prochaine prière & compte à rebours** : Calcul en temps réel de la prière active, de la suivante et du temps restant au format `"HH:mm"` et minutes entières.
- 📅 **Calendrier mensuel** : Horaires pour un mois entier ou un jour spécifique avec gestion native des années bissextiles.
- 🔍 **Recherche tolérante de wilaya** : Résolution par numéro (`16`), chaîne (`"16"` ou `"01"`), nom français sans accent (`"oran"`, `"bejaia"`) ou nom en langue arabe (`"الجزائر"`).
- 🧪 **Suite de tests automatisés** : 25 tests unitaires et d'intégration validant le moteur astronomique et les routes HTTP.
- 📚 **Documentation exhaustive** : Chaque fichier du projet est documenté ligne par ligne dans le dossier [docs/](docs/).

---

## 🚀 Installation & Démarrage

### 1. Cloner le dépôt
```bash
git clone git@github.com:keciramounir97/algerian-prayer-times-api.git
cd algerian-prayer-times-api
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Lancer les tests automatisés
```bash
npm test
```

### 4. Démarrer le serveur
```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```
L'API est accessible sur `http://localhost:5000` (ou la variable `PORT` définie dans votre environnement).

---

## 📖 Endpoints de l'API

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Page d'accueil JSON et documentation des routes |
| `GET` | `/api/health` | Contrôle d'état et uptime du serveur |
| `GET` | `/api/wilayas` | Liste des wilayas (supporte `?q=recherche`) |
| `GET` | `/api/wilayas/:code` | Informations géographiques d'une wilaya |
| `GET` | `/api/today/:code` | Horaires du jour, prière actuelle, suivante et compte à rebours |
| `GET` | `/api/next/:code` | Compte à rebours direct vers la prochaine prière |
| `GET` | `/api/prayer-times/:code?month=11&year=2026` | Calendrier mensuel (optionnel : `&day=15`) |

---

## 📚 Documentation Technique Détaillée

Pour consulter l'explication ligne par ligne de chaque composant de l'application, rendez-vous dans le dossier [`docs/`](docs/) :

- [docs/README.md](docs/README.md) : Vue d'ensemble de l'architecture et principes astronomiques
- [docs/server.md](docs/server.md) : Serveur Express et routing
- [docs/config-algeria.md](docs/config-algeria.md) : Paramètres confessionnels officiels
- [docs/data-wilayas.md](docs/data-wilayas.md) : Base des 58 wilayas et coordonnées géographiques
- [docs/utils-astronomy.md](docs/utils-astronomy.md) : Algorithmes de Jean Meeus (Soleil, Équation du temps, Jour Julien)
- [docs/utils-prayers.md](docs/utils-prayers.md) : Calculateur des 5 prières et compte à rebours
- [docs/package-json.md](docs/package-json.md) : Configuration npm et ESM
- [docs/test.md](docs/test.md) : Banc d'essai automatisé
- [docs/change1.md](docs/change1.md) : Rapport de débogage et correctifs
- [docs/change2.md](docs/change2.md) : Rapport des fonctionnalités ajoutées

---

## 📄 Licence

Ce projet est sous licence [ISC](LICENSE).
