# Documentation Ligne par Ligne : `utils/astronomy.js`

Ce module constitue le moteur mathématique et astronomique du projet. Il implémente les algorithmes de mécanique céleste de l'astronome belge **Jean Meeus** (*Astronomical Algorithms*, 1991) pour déterminer la position précise du Soleil, la déclinaison, l'équation du temps et le midi solaire vrai.

---

## Code source et explication détaillée ligne par ligne

```javascript
1: // =====================================================================
2: //  MODULE ASTRONOMIQUE
3: //  Calcule la position du soleil — formules de Jean Meeus
4: // =====================================================================
```
- **Lignes 1-4** : En-tête de commentaire présentant le rôle du module.

```javascript
6: export const deg2rad = (d) => (d * Math.PI) / 180;
7: export const rad2deg = (r) => (r * 180) / Math.PI;
```
- **Ligne 6** : `deg2rad(d)` convertit un angle exprimé en degrés vers des radians. Les fonctions trigonométriques JavaScript (`Math.sin`, `Math.cos`, `Math.tan`, `Math.atan`) attendent obligatoirement des radians.
- **Ligne 7** : `rad2deg(r)` convertit des radians en degrés d'arc pour les résultats finaux.

```javascript
8: export const normalize360 = (d) => ((d % 360) + 360) % 360;
```
- **Ligne 8** : Normalise un angle quelconque dans l'intervalle $[0^\circ, 360^\circ[$. L'opération modulo standard en JavaScript `(-10 % 360)` retourne `-10`. L'expression `((d % 360) + 360) % 360` garantit que le résultat est toujours strictement positif.

```javascript
9: export const normalize180 = (d) => {
10:   const x = normalize360(d);
11:   return x > 180 ? x - 360 : x;
12: };
```
- **Lignes 9-12** : Normalise un angle dans l'intervalle $[-180^\circ, +180^\circ]$. Utile pour exprimer les écarts angulaires courts, notamment pour l'équation du temps (où un angle de $359^\circ$ équivaut à un retard de $-1^\circ$).

---

### Fonction `julianDay(year, month, day)`

```javascript
15: export function julianDay(year, month, day) {
16:   if (month <= 2) {
17:     year -= 1;
18:     month += 12;
19:   }
```
- **Lignes 15-19** : Calcule le **Jour Julien** (*Julian Day*, $JD$) à $0\text{h}$ Temps Universel. En astronomie, pour éviter les irrégularités des années bissextiles, les mois de janvier ($M=1$) et février ($M=2$) sont traités comme les 13ᵉ et 14ᵉ mois de l'année précédente ($Y - 1$).

```javascript
20:   const A = Math.floor(year / 100);
21:   const B = 2 - A + Math.floor(A / 4);
```
- **Lignes 20-21** : Constantes du calendrier Grégorien introduit en octobre 1582. $A$ est le siècle grégorien et $B$ corrige le saut des années séculaires non bissextiles.

```javascript
22:   return (
23:     Math.floor(365.25 * (year + 4716)) +
24:     Math.floor(30.6001 * (month + 1)) +
25:     day +
26:     B -
27:     1524.5
28:   );
29: }
```
- **Lignes 22-29** : Formule standard de Jean Meeus. Le terme $-1524.5$ cale l'origine astronomique du jour julien au 1ᵉʳ janvier 4713 avant J.-C. à 12h UT. Pour un jour civil commençant à minuit ($0\text{h}$ UT), le résultat se termine par $.5$.

---

### Fonction `sunPosition(jd)`

```javascript
32: export function sunPosition(jd) {
33:   const T = (jd - 2451545.0) / 36525;
```
- **Lignes 32-33** : $T$ représente le nombre de siècles juliens (36525 jours) écoulés depuis l'époque fondamentale astronomique **J2000.0** (1ᵉʳ janvier 2000 à 12h UT, $JD = 2451545.0$).

```javascript
34:   const L0 = normalize360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
```
- **Ligne 34** : $L_0$ est la **longitude moyenne géométrique** du Soleil (en degrés), normalisée sur $360^\circ$.

```javascript
35:   const M = normalize360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
36:   const Mr = deg2rad(M);
```
- **Ligne 35-36** : $M$ est l'**anomalie moyenne** du Soleil (l'angle qu'il parcourrait s'il suivait une orbite parfaitement circulaire à vitesse constante). `Mr` est sa conversion en radians pour le calcul trigonométrique.

```javascript
38:   const C =
39:     (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr) +
40:     (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) +
41:     0.000289 * Math.sin(3 * Mr);
```
- **Lignes 38-41** : $C$ est l'**équation du centre**. Comme l'orbite terrestre est une ellipse (1ʳᵉ loi de Kepler), la Terre accélère au périhélie et ralentit à l'aphélie. $C$ corrige cet écart de vitesse.

```javascript
43:   const trueLong = L0 + C;
```
- **Ligne 43** : Longueur vraie du Soleil sur l'écliptique ($\lambda_{\text{true}} = L_0 + C$).

```javascript
44:   const omega = 125.04 - 1934.136 * T;
45:   const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(deg2rad(omega));
```
- **Lignes 44-45** : Longitude apparente $\lambda$, corrigée de l'aberration de la lumière ($-0.00569^\circ$) et de la nutation de l'axe terrestre ($\Omega$).

```javascript
47:   const epsilon0 =
48:     23 +
49:     (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
50:   const epsilon = epsilon0 + 0.00256 * Math.cos(deg2rad(omega));
```
- **Lignes 47-50** : Calcul de l'**obliquité de l'écliptique** ($\epsilon$, inclinaison de l'axe de la Terre, environ $23^\circ 26'$). $\epsilon_0$ est l'obliquité moyenne et $\epsilon$ intègre la correction de nutation.

```javascript
52:   const declinaison = rad2deg(
53:     Math.asin(Math.sin(deg2rad(epsilon)) * Math.sin(deg2rad(lambda))),
54:   );
```
- **Lignes 52-54** : **Déclinaison solaire** ($\delta$). C'est l'angle que fait la direction du Soleil avec le plan de l'équateur céleste terrestre. Elle varie entre $-23.44^\circ$ (solstice d'hiver) et $+23.44^\circ$ (solstice d'été).

```javascript
56:   const alpha = rad2deg(
57:     Math.atan2(
58:       Math.cos(deg2rad(epsilon)) * Math.sin(deg2rad(lambda)),
59:       Math.cos(deg2rad(lambda)),
60:     ),
61:   );
```
- **Lignes 56-61** : **Ascension droite** ($\alpha$) du Soleil en degrés, calculée via `Math.atan2` pour positionner le quadrant correct.

```javascript
63:   // Equation du temps en minutes : E = 4 * (L0 - alpha)
64:   const eqTime = 4 * normalize180(L0 - 0.0057183 - alpha);
65: 
66:   return { declinaison, eqTime };
67: }
```
- **Lignes 63-67** : Calcul de l'**Équation du Temps** ($E$ en minutes). Comme chaque degré de rotation terrestre correspond à 4 minutes de temps ($360^\circ / 24\text{h} = 15^\circ/\text{h} = 4\text{ min}/^\circ$), la différence entre la longitude moyenne du soleil fictif ($L_0$) et l'ascension droite du soleil réel ($\alpha$) multipliée par 4 donne l'avance ou le retard du soleil en minutes (oscillant entre $-14.2$ et $+16.4$ minutes sur l'année). La fonction retourne la déclinaison et cette équation du temps.

---

### Fonction `hourAngle(altitude, latitude, declinaison)`

```javascript
70: export function hourAngle(altitude, latitude, declinaison) {
71:   const latR = deg2rad(latitude);
72:   const decR = deg2rad(declinaison);
73:   const altR = deg2rad(altitude);
```
- **Lignes 70-73** : Prépare la conversion des trois angles en radians :
  - `altitude` : hauteur angulaire visée au-dessus ou sous l'horizon (ex : $-18^\circ$ pour Fajr).
  - `latitude` : latitude géographique du lieu.
  - `declinaison` : déclinaison solaire du jour.

```javascript
75:   const cosH =
76:     (Math.sin(altR) - Math.sin(latR) * Math.sin(decR)) /
77:     (Math.cos(latR) * Math.cos(decR));
```
- **Lignes 75-77** : Formule trigonométrique fondamentale du triangle sphérique céleste :
  $$\cos(H) = \frac{\sin(\text{alt}) - \sin(\phi)\sin(\delta)}{\cos(\phi)\cos(\delta)}$$
  où $H$ est l'**angle horaire**.

```javascript
79:   if (cosH > 1 || cosH < -1) return null;
80:   return rad2deg(Math.acos(cosH));
81: }
```
- **Lignes 79-81** : Vérifie si $\cos(H)$ est hors du domaine valide $[-1, 1]$. Si c'est le cas (phénomène de soleil de minuit ou nuit polaire où le soleil n'atteint jamais cette altitude), la fonction retourne `null`. Sinon, elle retourne l'angle horaire $H$ en degrés via `acos`.

---

### Fonction `solarNoon(jd, longitude, timezone)`

```javascript
84: // Midi solaire vrai (en heures décimales en heure locale standard)
85: // Correction fondamentale : T_midi = 12 - (Longitude / 15) + Timezone - (Equation du temps / 60)
86: export function solarNoon(jd, longitude, timezone) {
87:   return 12 - longitude / 15 + timezone - sunPosition(jd).eqTime / 60;
88: }
```
- **Lignes 84-88** : Calcule l'heure exacte du **Midi Solaire Vrai** (*Zawal*) en heure locale :
  - `12` : midi moyen au méridien de Greenwich.
  - `- longitude / 15` : correction de la longitude (l'est est en avance, $15^\circ = 1\text{h}$).
  - `+ timezone` : décalage horaire civil officiel (+1 pour l'Algérie).
  - `- eqTime / 60` : correction de l'équation du temps convertie en heures.

---

### Fonction `timeFromAngle(jd, longitude, timezone, H, isMorning)`

```javascript
91: export function timeFromAngle(jd, longitude, timezone, H, isMorning) {
92:   const noon = solarNoon(jd, longitude, timezone);
93:   const offset = H / 15;
94:   return isMorning ? noon - offset : noon + offset;
95: }
```
- **Lignes 91-95** : Convertit l'angle horaire $H$ (exprimé en degrés) en heure décimale :
  - `offset = H / 15` : conversion des degrés en heures ($15^\circ = 1\text{h}$).
  - Si `isMorning` est vrai (Fajr, Chourouk), l'événement se produit *avant* midi : `noon - offset`.
  - Si `isMorning` est faux (Asr, Maghrib, Isha), l'événement se produit *après* midi : `noon + offset`.
