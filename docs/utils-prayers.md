# Documentation Ligne par Ligne : `utils/prayers.js`

Ce fichier orchestre le calcul complet des horaires des cinq prières quotidiennes ainsi que du lever du soleil (*Chourouk*) pour une wilaya et une date données, en appliquant les préceptes de la méthode officielle algérienne. Il calcule également la prière courante et le compte à rebours vers la prochaine prière.

---

## Code source et explication détaillée ligne par ligne

```javascript
1: // =====================================================================
2: //  CALCUL DES HORAIRES DE PRIÈRE — MÉTHODE ALGÉRIENNE
3: //  -------------------------------------------------------------------
4: //  Config officielle (Ministère des Affaires Religieuses) :
5: //    Fajr  = -18°  sous l'horizon
6: //    Isha  = -17°  sous l'horizon
7: //    Asr   = facteur 1 (école Maliki)
8: //    Timezone = UTC+1 (pas de DST en Algérie)
9: // =====================================================================
```
- **Lignes 1-9** : En-tête rappelant la convention officielle algérienne : angle de Fajr à $-18^\circ$, angle d'Isha à $-17^\circ$, école juridique Malékite pour l'Asr, et fuseau horaire UTC+1 sans heure d'été.

```javascript
11: import {
12:   julianDay,
13:   sunPosition,
14:   hourAngle,
15:   solarNoon,
16:   timeFromAngle,
17:   rad2deg,
18:   deg2rad,
19: } from "./astronomy.js";
```
- **Lignes 11-19** : Importation des primitives astronomiques nécessaires depuis [utils/astronomy.js](file:///c:/Users/mounir/Desktop/css/New%20folder/backend/utils/astronomy.js).

```javascript
22: import { ALGERIA } from "../config/algeria.js";
```
- **Ligne 22** : Importation des paramètres officiels de la méthode algérienne depuis [config/algeria.js](file:///c:/Users/mounir/Desktop/css/New%20folder/backend/config/algeria.js).

```javascript
25: const SUNRISE_ALT = -0.833;
```
- **Ligne 25** : Altitude conventionnelle du centre du Soleil lors du lever (*Chourouk*) et du coucher (*Maghrib*). Le bord supérieur du soleil apparaît/disparaît lorsque le centre du disque est à $-0.833^\circ$ ($-50'$ d'arc), résultat de la réfraction atmosphérique moyenne à l'horizon ($34'$) ajoutée au demi-diamètre apparent du Soleil ($16'$).

---

### Fonction `formatTime(hours)`

```javascript
30: export function formatTime(hours) {
31:   if (hours === null || isNaN(hours)) return "—";
```
- **Lignes 30-31** : Formate une heure décimale (ex : `5.25`) en chaîne standardisée `"HH:mm"` (`"05:15"`). Si l'heure est nulle ou indéterminée, elle renvoie un tiret `"—"`.

```javascript
32:   let h = ((hours % 24) + 24) % 24;
33:   const totalMin = Math.round(h * 60);
34:   const hh = Math.floor(totalMin / 60) % 24;
35:   const mm = totalMin % 60;
36:   return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
37: }
```
- **Ligne 32** : Normalisation de l'heure dans la tranche $[0, 24[$ pour parer aux débordements de minuit.
- **Ligne 33** : Arrondi à la minute entière la plus proche pour éviter les erreurs d'imprécision en virgule flottante.
- **Lignes 34-36** : Extraction des heures `hh` et des minutes `mm` avec formatage à deux chiffres via `.padStart(2, "0")`.

---

### Fonction `applyAdjustment(hours, minutes)`

```javascript
42: export function applyAdjustment(hours, minutes = 0) {
43:   if (hours === null || isNaN(hours)) return null;
44:   return hours + (minutes || 0) / 60;
45: }
```
- **Lignes 42-45** : Ajoute un nombre de minutes d'ajustement officiel à une heure décimale (`minutes / 60`). Retourne `null` si l'heure d'entrée est non calculable.

---

### Fonction `calculatePrayerTimes(...)`

```javascript
50: export function calculatePrayerTimes({
51:   year,
52:   month,
53:   day,
54:   latitude,
55:   longitude,
56: }) {
```
- **Lignes 50-56** : Fonction principale de calcul recevant un objet déstructuré : l'année, le mois civil, le jour du mois, la latitude et la longitude géographiques du lieu.

```javascript
57:   const cfg = ALGERIA;
58:   const adjustments = cfg.adjustments || cfg.adjustements || {};
```
- **Lignes 57-58** : Récupère la configuration algérienne et extrait en toute sécurité le sous-objet `adjustments`.

```javascript
60:   // 1. Jour julien
61:   const jd = julianDay(year, month, day);
62: 
63:   // 2. Position du soleil
64:   const { declinaison } = sunPosition(jd);
65: 
66:   // 3. Midi solaire vrai
67:   const noon = solarNoon(jd, longitude, cfg.timezone);
```
- **Lignes 60-67** : 
  1. Calcul du Jour Julien pour la date requise.
  2. Extraction de la déclinaison solaire du jour ($\delta$).
  3. Calcul de l'instant du midi solaire vrai (*Zawal*) pour la longitude et le fuseau horaire de la wilaya.

```javascript
69:   // 4. Angles horaires
70:   const H_fajr = hourAngle(-cfg.fajrAngle, latitude, declinaison);
71:   const H_sunrise = hourAngle(SUNRISE_ALT, latitude, declinaison);
72:   const H_isha = hourAngle(-cfg.ishaAngle, latitude, declinaison);
```
- **Lignes 69-72** : Calcule les angles horaires ($H$) :
  - `H_fajr` : pour une altitude de $-18^\circ$.
  - `H_sunrise` : pour l'altitude de réfraction $-0.833^\circ$ (utilisée pour le lever et le coucher du soleil).
  - `H_isha` : pour une altitude de $-17^\circ$.

```javascript
74:   // 5. Angle horaire de Asr (école Maliki : ombre de l'objet = sa taille)
75:   //    altitude = atan(1 / (facteur + tan|lat - declinaison|))
76:   const asrAlt = rad2deg(
77:     Math.atan(
78:       1 / (cfg.asrFactor + Math.tan(deg2rad(Math.abs(latitude - declinaison)))),
79:     ),
80:   );
81:   const H_asr = hourAngle(asrAlt, latitude, declinaison);
```
- **Lignes 74-81** : Détermine l'altitude du soleil au moment de l'**Asr**. Selon la jurisprudence islamique malékite, l'ombre d'un objet vertical est égale à sa propre hauteur (facteur $1$) plus la longueur de son ombre à midi. L'angle d'altitude solaire $\alpha$ vérifie :
  $$\text{arccot}(\alpha) = 1 + \tan|\phi - \delta| \iff \alpha = \arctan\left(\frac{1}{1 + \tan|\phi - \delta|}\right)$$
  La ligne 81 calcule ensuite l'angle horaire `H_asr` correspondant à cette altitude.

```javascript
83:   // 6. Calcul brut des heures décimales
84:   let fajr =
85:     H_fajr !== null
86:       ? timeFromAngle(jd, longitude, cfg.timezone, H_fajr, true)
87:       : null;
88:   let sunrise =
89:     H_sunrise !== null
90:       ? timeFromAngle(jd, longitude, cfg.timezone, H_sunrise, true)
91:       : null;
92:   let dhuhr = noon;
93:   let asr =
94:     H_asr !== null
95:       ? timeFromAngle(jd, longitude, cfg.timezone, H_asr, false)
96:       : null;
97:   let maghrib =
98:     H_sunrise !== null
99:       ? timeFromAngle(jd, longitude, cfg.timezone, H_sunrise, false)
100:       : null;
101:   let isha =
102:     H_isha !== null
103:       ? timeFromAngle(jd, longitude, cfg.timezone, H_isha, false)
104:       : null;
```
- **Lignes 83-104** : Convertit chaque angle horaire en heure locale :
  - `fajr` : matin (`true`) avant midi.
  - `sunrise` : matin (`true`) avant midi.
  - `dhuhr` : midi solaire vrai (`noon`).
  - `asr` : après-midi (`false`).
  - `maghrib` : coucher de soleil avec `H_sunrise` l'après-midi (`false`).
  - `isha` : nuit (`false`).

```javascript
106:   // 7. Règle de secours : latitudes extrêmes / nuit courte
107:   //    → règle "1/7 de la nuit" recommandée par la ligue islamique mondiale (MWL)
108:   if (fajr === null && sunrise !== null && maghrib !== null) {
109:     const nightDur = 24 + sunrise - maghrib;
110:     fajr = sunrise - nightDur / 7;
111:   }
112:   if (isha === null && maghrib !== null && sunrise !== null) {
113:     const nightDur = 24 + sunrise - maghrib;
114:     isha = maghrib + nightDur / 7;
115:   }
```
- **Lignes 106-115** : Règle de repli astronomique (*One-Seventh Rule*). Aux latitudes élevées ou lors des courtes nuits d'été où le soleil ne descend pas en dessous de $-18^\circ$, l'intervalle crépusculaire ne peut être résolu géométriquement. La règle islamique divise la durée nocturne en 7 parts : Fajr se situe à un septième de la nuit avant le lever du soleil, et Isha à un septième de la nuit après le coucher.

```javascript
117:   // 8. Application des ajustements officiels (en minutes)
118:   fajr = applyAdjustment(fajr, adjustments.fajr);
119:   sunrise = applyAdjustment(sunrise, adjustments.sunrise);
120:   dhuhr = applyAdjustment(dhuhr, adjustments.dhuhr);
121:   asr = applyAdjustment(asr, adjustments.asr);
122:   maghrib = applyAdjustment(maghrib, adjustments.maghrib);
123:   isha = applyAdjustment(isha, adjustments.isha);
```
- **Lignes 117-123** : Application des ajustements du Ministère (+1 min pour Dhuhr et +1 min pour Maghrib).

```javascript
125:   // 9. Formatage final "HH:mm"
126:   return {
127:     fajr: formatTime(fajr),
128:     sunrise: formatTime(sunrise),
129:     dhuhr: formatTime(dhuhr),
130:     asr: formatTime(asr),
131:     maghrib: formatTime(maghrib),
132:     isha: formatTime(isha),
133:   };
134: }
```
- **Lignes 125-134** : Formate et retourne l'objet contenant les chaînes `"HH:mm"` pour les 6 moments de la journée.

---

### Fonction `calculateMonth(...)`

```javascript
139: export function calculateMonth({ year, month, latitude, longitude }) {
140:   const daysInMonth = new Date(year, month, 0).getDate();
141:   const result = [];
```
- **Lignes 139-141** : Détermine le nombre exact de jours dans le mois via `new Date(year, month, 0).getDate()` (gérant nativement les années bissextiles pour février).

```javascript
143:   for (let day = 1; day <= daysInMonth; day++) {
144:     const t = calculatePrayerTimes({ year, month, day, latitude, longitude });
145:     result.push({
146:       day,
147:       date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
148:       ...t,
149:     });
150:   }
151: 
152:   return result;
153: }
```
- **Lignes 143-153** : Itère sur chaque jour du mois, calcule les horaires pour chacun et retourne le tableau complet du calendrier mensuel.

---

### Fonction `getNextPrayer(times, date)`

```javascript
158: export function getNextPrayer(times, date = new Date()) {
159:   const parseToMinutes = (timeStr) => {
160:     if (!timeStr || timeStr === "—") return null;
161:     const [h, m] = timeStr.split(":").map(Number);
162:     return h * 60 + m;
163:   };
```
- **Lignes 158-163** : Convertit une heure `"HH:mm"` en nombre total de minutes depuis minuit ($0$ à $1439$).

```javascript
165:   const currentMinutes = date.getHours() * 60 + date.getMinutes();
166: 
167:   const schedule = [
168:     { key: "fajr", name: "Fajr", name_ar: "الفجر", minutes: parseToMinutes(times.fajr), time: times.fajr },
169:     { key: "sunrise", name: "Chourouk", name_ar: "الشروق", minutes: parseToMinutes(times.sunrise), time: times.sunrise },
170:     { key: "dhuhr", name: "Dhuhr", name_ar: "الظهر", minutes: parseToMinutes(times.dhuhr), time: times.dhuhr },
171:     { key: "asr", name: "Asr", name_ar: "العصر", minutes: parseToMinutes(times.asr), time: times.asr },
172:     { key: "maghrib", name: "Maghrib", name_ar: "المغرب", minutes: parseToMinutes(times.maghrib), time: times.maghrib },
173:     { key: "isha", name: "Isha", name_ar: "العشاء", minutes: parseToMinutes(times.isha), time: times.isha },
174:   ];
```
- **Lignes 165-174** : Récupère les minutes actuelles de la journée et structure le tableau chronologique des étapes journalières avec leurs noms en français et en arabe.

```javascript
176:   let current = null;
177:   let next = null;
178: 
179:   for (let i = 0; i < schedule.length; i++) {
180:     if (schedule[i].minutes !== null && currentMinutes < schedule[i].minutes) {
181:       next = schedule[i];
182:       current = i > 0 ? schedule[i - 1] : { ...schedule[schedule.length - 1], note: "from_yesterday" };
183:       break;
184:     }
185:   }
```
- **Lignes 176-185** : Parcourt la séquence chronologique pour repérer le premier événement dont l'heure est strictement postérieure à l'heure courante :
  - Il devient l'événement `next`.
  - L'événement immédiatement précédent devient `current`.

```javascript
187:   // Si on a dépassé l'Isha, la prochaine est Fajr de demain
188:   if (!next) {
189:     current = schedule[schedule.length - 1]; // Isha
190:     next = { ...schedule[0], isTomorrow: true }; // Fajr demain
191:   }
```
- **Lignes 187-191** : Si aucune prière n'est trouvée (l'heure actuelle dépasse l'Isha), la prière courante est Isha et la prochaine est obligatoirement le Fajr du lendemain (`isTomorrow: true`).

```javascript
193:   // Calcul du temps restant en minutes
194:   let remainingMinutes;
195:   if (next.minutes >= currentMinutes) {
196:     remainingMinutes = next.minutes - currentMinutes;
197:   } else {
198:     remainingMinutes = (24 * 60 - currentMinutes) + next.minutes;
199:   }
```
- **Lignes 193-199** : Calcule le temps restant en minutes, en ajoutant les minutes restantes jusqu'à minuit ($(1440 - \text{actuel})$) plus les minutes du Fajr si l'événement a lieu demain.

```javascript
201:   const remHours = Math.floor(remainingMinutes / 60);
202:   const remMins = remainingMinutes % 60;
203:   const remainingFormatted = `${String(remHours).padStart(2, "0")}h ${String(remMins).padStart(2, "0")}m`;
```
- **Lignes 201-203** : Formate le temps restant en format texte `"XXh YYm"`.

```javascript
205:   return {
206:     current: { ... },
207:     next: { ... },
208:     remainingMinutes,
209:     remainingFormatted,
210:   };
211: }
```
- **Lignes 205-211** : Retourne l'objet complet décrivant la prière actuelle, la prochaine et le compte à rebours.
