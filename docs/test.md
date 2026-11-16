# Documentation Ligne par Ligne : `test.js`

Ce fichier implémente le banc d'essai et la suite complète de 25 tests unitaires et d'intégration validant le bon fonctionnement de l'application.

---

## Code source et explication détaillée ligne par ligne

```javascript
1: // =====================================================================
2: //  SUITE DE TESTS AUTOMATISÉS — API مواقيت الصلاة
3: // =====================================================================
```
- **Lignes 1-3** : En-tête descriptif de la suite de tests.

```javascript
5: process.env.NODE_ENV = "test";
```
- **Ligne 5** : Définit la variable d'environnement `NODE_ENV` sur `"test"` pour avertir les modules qu'ils s'exécutent dans un contexte de test.

```javascript
7: import assert from "node:assert";
8: import { app, findWilaya } from "./server.js";
9: import { calculatePrayerTimes, calculateMonth, getNextPrayer } from "./utils/prayers.js";
10: import { julianDay, sunPosition, solarNoon } from "./utils/astronomy.js";
```
- **Ligne 7** : Importe le module natif d'assertions Node.js `node:assert` (ne nécessitant aucun framework lourd externe comme Jest ou Mocha).
- **Lignes 8-10** : Importe les composants du serveur, les utilitaires de calcul de prière et le moteur astronomique à tester.

```javascript
12: async function runTests() {
13:   console.log("▶ Démarrage de la suite de tests...\n");
14:   let passed = 0;
15:   let failed = 0;
```
- **Lignes 12-15** : Fonction asynchrone principale `runTests()` initialisant les compteurs de tests réussis (`passed`) et échoués (`failed`).

```javascript
17:   function test(name, fn) {
18:     try {
19:       fn();
20:       console.log(`  ✓ ${name}`);
21:       passed++;
22:     } catch (err) {
23:       console.error(`  ✗ ${name}`);
24:       console.error(`    -> ${err.message}`);
25:       failed++;
26:     }
27:   }
```
- **Lignes 17-27** : Runner de test unitaire synchrone. Exécute la fonction de test `fn()` : si aucune assertion ne lève d'erreur, affiche une coche verte `✓` et incrémente `passed`. En cas d'échec (`AssertionError`), capture l'exception, affiche `✗` avec le message d'erreur et incrémente `failed`.

---

### Section 1 : Tests du Module Astronomique

```javascript
30:   console.log("--- 1. Module Astronomique & Formules Meeus ---");
31: 
32:   test("Calcul du Jour Julien (epoch J2000)", () => {
33:     const jd = julianDay(2000, 1, 1);
34:     assert.strictEqual(jd, 2451544.5);
35:   });
```
- **Lignes 30-35** : Vérifie que le calcul du Jour Julien pour le 1ᵉʳ janvier 2000 à 0h UT donne exactement `2451544.5`, valeur de référence des éphémérides astronomiques de l'époque J2000.

```javascript
37:   test("Position du Soleil & Équation du temps dans la plage valide (-15m à +17m)", () => {
38:     const jd = julianDay(2026, 11, 16);
39:     const { declinaison, eqTime } = sunPosition(jd);
40:     assert.ok(declinaison < 0, "Déclinaison en novembre doit être négative");
41:     assert.ok(eqTime > 14 && eqTime < 17, `Equation du temps en novembre doit être ~15 min (reçu: ${eqTime})`);
42:   });
```
- **Lignes 37-42** : Vérifie les coordonnées du Soleil en novembre : déclinaison négative (soleil au sud de l'équateur céleste en automne/hiver) et équation du temps positive oscillant autour de $+15$ minutes.

```javascript
44:   test("Midi Solaire pour Alger (~12h32 à 12h34 en mi-novembre)", () => {
45:     const jd = julianDay(2026, 11, 16);
46:     const noon = solarNoon(jd, 3.0588, 1);
47:     assert.ok(noon > 12.45 && noon < 12.65, `Midi solaire à Alger doit être vers 12:33 (reçu: ${noon})`);
48:   });
```
- **Lignes 44-48** : Valide la correction du signe de l'équation du temps : le midi solaire pour Alger ($\text{long} = 3.0588^\circ, \text{TZ} = +1$) doit être à $\approx 12\text{h}33$ et non à $13\text{h}05$.

---

### Section 2 : Tests des Horaires de Prière

```javascript
52:   test("Calcul des 5 prières pour Alger (16 novembre)", () => {
53:     const times = calculatePrayerTimes({ ... });
...
68:     assert.ok(times.fajr < times.sunrise, "Fajr doit précéder le lever");
69:     assert.ok(times.sunrise < times.dhuhr, "Le lever doit précéder Dhuhr");
70:     assert.ok(times.dhuhr < times.asr, "Dhuhr doit précéder Asr");
71:     assert.ok(times.asr < times.maghrib, "Asr doit précéder Maghrib");
72:     assert.ok(times.maghrib < times.isha, "Maghrib doit précéder Isha");
73:   });
```
- **Lignes 52-73** : Valide le format `"HH:mm"` de chaque horaire et confirme l'ordre chronologique strict obligatoire dans la journée islamique.

```javascript
75:   test("Calcul pour un mois complet (nombre de jours exact)", () => {
76:     const daysFev = calculateMonth({ year: 2024, month: 2, latitude: 36.75, longitude: 3.05 });
77:     assert.strictEqual(daysFev.length, 29, "Février 2024 doit avoir 29 jours");
78: 
79:     const daysNov = calculateMonth({ year: 2026, month: 11, latitude: 36.75, longitude: 3.05 });
80:     assert.strictEqual(daysNov.length, 30, "Novembre doit avoir 30 jours");
81:   });
```
- **Lignes 75-81** : Vérifie la gestion des années bissextiles (29 jours pour février 2024) et des mois de 30 jours.

```javascript
83:   test("Logique getNextPrayer (détermination de la prochaine prière et compte à rebours)", () => {
...
96:     const midday = new Date("2026-11-16T14:00:00");
97:     const res1 = getNextPrayer(sampleTimes, midday);
98:     assert.strictEqual(res1.current.key, "dhuhr");
99:     assert.strictEqual(res1.next.key, "asr");
100:    assert.strictEqual(res1.remainingMinutes, 90);
...
106:    const night = new Date("2026-11-16T22:00:00");
107:    const res2 = getNextPrayer(sampleTimes, night);
108:    assert.strictEqual(res2.next.key, "fajr");
109:    assert.strictEqual(res2.next.isTomorrow, true);
110:  });
```
- **Lignes 83-110** : Teste le calcul de la prochaine prière en journée (à 14h00, la suivante est Asr dans 90 min) et pendant la nuit (à 22h00, la suivante est Fajr du lendemain).

---

### Section 3 : Tests de Recherche de Wilaya

```javascript
115:  test("Recherche par code entier (16 -> Alger)", () => { ... });
121:  test("Recherche par string numérique ('16')", () => { ... });
127:  test("Recherche par code avec zéro ('01' -> Adrar)", () => { ... });
133:  test("Recherche par nom français sans casse ('oran' -> Oran)", () => { ... });
139:  test("Recherche par nom français avec accent insensible ('bejaia' -> Béjaïa)", () => { ... });
145:  test("Recherche par nom arabe ('قسنطينة' -> Constantine)", () => { ... });
151:  test("Recherche avec code inexistant ('999' -> null)", () => { ... });
```
- **Lignes 115-155** : Valide l'ensemble des cas d'utilisation de la fonction `findWilaya` (entier, texte, padding, casse, accents, arabe, codes invalides).

---

### Section 4 : Tests des Endpoints HTTP sur Serveur Éphémère

```javascript
160:  const testServer = await new Promise((resolve) => {
161:    const s = app.listen(0, () => resolve(s));
162:  });
163: 
164:  const port = testServer.address().port;
165:  const baseUrl = `http://localhost:${port}`;
```
- **Lignes 160-165** : Démarre une instance d'Express sur le port dynamique `0`. Le système d'exploitation attribue un port libre inutilisé, évitant tout conflit avec le port `5000` de production.

```javascript
167:  const fetchJson = async (path) => {
168:    const res = await fetch(`${baseUrl}${path}`);
169:    const data = await res.json();
170:    return { status: res.status, data };
171:  };
```
- **Lignes 167-171** : Fonction utilitaire de requête HTTP effectuant l'appel via `fetch` natif Node.js et désérialisant la réponse JSON.

```javascript
173:  try {
174:    // GET /
175:    const root = await fetchJson("/");
...
227:  } finally {
228:    testServer.close();
229:  }
```
- **Lignes 173-229** : Exécute les tests d'intégration sur tous les endpoints HTTP (`/`, `/api/health`, `/api/wilayas`, `/api/wilayas/:code`, `/api/today/:code`, `/api/next/:code`, `/api/prayer-times/:code`, ainsi que les codes d'erreurs 400 et 404). Le bloc `finally` garantit que `testServer.close()` est toujours exécuté pour libérer les ressources réseau.

```javascript
234:  console.log(`Résultats finaux : ${passed} passés, ${failed} échoués`);
237:  if (failed > 0) {
238:    process.exit(1);
239:  }
```
- **Lignes 234-242** : Affiche le bilan d'exécution. Si `failed > 0`, le processus se termine avec le code d'erreur `1` (faisant échouer les pipelines d'intégration continue CI/CD).
