# Documentation Ligne par Ligne : `package.json`

Ce fichier est le manifeste de configuration du projet Node.js. Il définit le nom du paquet, la version, le type de module, les scripts d'exécution et les dépendances nécessaires.

---

## Code source et explication ligne par ligne

```json
1: {
2:   "name": "prayer-times-api",
```
- **Ligne 2** : Nom du projet / package Node.js. Sert d'identifiant dans l'écosystème npm.

```json
3:   "version": "1.1.0",
```
- **Ligne 3** : Version du projet suivant la convention *Semantic Versioning* (`MAJOR.MINOR.PATCH`). La version a été incrémentée à `1.1.0` pour refléter les corrections de bugs et l'ajout des nouvelles fonctionnalités de filtrage, santé et prochaine prière.

```json
4:   "description": "Algerian Prayer Times API (Ministère des Affaires Religieuses method)",
```
- **Ligne 4** : Brève description du rôle de l'API et de la méthode appliquée.

```json
5:   "main": "server.js",
```
- **Ligne 5** : Fichier d'entrée principal (*entry point*) de l'application lorsqu'elle est exécutée ou importée comme module.

```json
6:   "scripts": {
7:     "start": "node server.js",
8:     "dev": "nodemon server.js",
9:     "test": "node test.js"
10:   },
```
- **Ligne 7** : `"start": "node server.js"` : Commande standard de production pour démarrer le serveur HTTP (`npm start`).
- **Ligne 8** : `"dev": "nodemon server.js"` : Commande de développement (`npm run dev`) utilisant `nodemon` pour recharger automatiquement le serveur à chaque modification de fichier.
- **Ligne 9** : `"test": "node test.js"` : Commande d'exécution de la suite de tests automatisés (`npm test`).

```json
11:   "keywords": [
12:     "prayer-times",
13:     "algeria",
14:     "islam",
15:     "salat",
16:     "horaires-priere"
17:   ],
```
- **Lignes 11-17** : Mots-clés de référencement pour faciliter la découvrabilité du projet.

```json
18:   "author": "",
19:   "license": "ISC",
```
- **Ligne 18** : Nom de l'auteur du projet.
- **Ligne 19** : Licence open source du projet (MIT).

```json
20:   "type": "module",
```
- **Ligne 20** : **Directive essentielle**. Déclare le projet comme utilisant nativement les **ECMAScript Modules (ESM)**. Cela active l'utilisation de `import` et `export` au lieu de `require()` et `module.exports` de CommonJS.

```json
21:   "dependencies": {
22:     "axios": "^1.21.1",
23:     "cors": "^2.8.6",
24:     "express": "^5.3.0"
25:   },
```
- **Ligne 22** : `axios` : Client HTTP basé sur les promesses.
- **Ligne 23** : `cors` : Middleware Express gérant les en-têtes HTTP de partage de ressources entre origines multiples (*Cross-Origin Resource Sharing*).
- **Ligne 24** : `express` : Framework web minimaliste et performant pour la création des routes HTTP REST.

```json
26:   "devDependencies": {
27:     "nodemon": "^3.1.14"
28:   }
29: }
```
- **Ligne 27** : `nodemon` : Outil de développement surveillant les fichiers sources et redémarrant le processus Node à chaud lors des modifications.
- **Ligne 29** : Fin du manifeste JSON.
