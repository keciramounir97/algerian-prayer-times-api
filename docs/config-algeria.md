# Documentation Ligne par Ligne : `config/algeria.js`

Ce fichier définit les constantes astronomiques et les paramètres juridiques islamiques officiels retenus par la République Algérienne (Ministère des Affaires Religieuses et des Wakfs) pour le calcul des horaires de prière.

---

## Code source complet et explication ligne par ligne

```javascript
1: export const ALGERIA = {
```
- **Ligne 1** : Exporte l'objet de configuration `ALGERIA` en tant qu'export nommé (`named export`) selon la syntaxe ES Modules (`import/export`). Cela permet de l'importer dans `utils/prayers.js` ou dans tout autre module sans risquer de collision de noms.

```javascript
2:   fajrAngle: 18.0,
```
- **Ligne 2** : Définit l'angle sous l'horizon pour la prière de l'Aube (**Fajr**), fixé à $18.0^\circ$. Selon la méthode algérienne et la majorité du monde musulman (Ligue Islamique Mondiale), l'aube véritable (*al-Fajr al-Sâdiq*) apparaît lorsque le centre du disque solaire se trouve à $18^\circ$ sous l'horizon géométrique.

```javascript
3:   ishaAngle: 17.0,
```
- **Ligne 3** : Définit l'angle sous l'horizon pour la prière de la Nuit (**Isha**), fixé à $17.0^\circ$. Il correspond à la disparition complète de la lueur crépusculaire rougeoyante (*ash-Shafaq al-Ahmar*) selon le rite malékite adopté en Algérie.

```javascript
4:   adjustments: {
5:     fajr: 0,
6:     sunrise: 0,
7:     dhuhr: 1,
8:     asr: 0,
9:     maghrib: 1,
10:     isha: 0,
11:   },
```
- **Ligne 4** : Déclare un sous-objet `adjustments` contenant les minutes d'ajustement ou de précaution (*Ihtiyat*) appliquées à chaque prière.
- **Ligne 5** : `fajr: 0` : Aucun décalage artificiel ajouté à l'heure brute de Fajr.
- **Ligne 6** : `sunrise: 0` : Aucun décalage ajouté au lever du soleil (*Chourouk*).
- **Ligne 7** : `dhuhr: 1` : Ajoute **+1 minute** après le zénith solaire (*Zawal*). Sur le plan canonique, il est déconseillé de prier au moment exact où le soleil culmine ; la prière de Dhuhr ne commence qu'au début de la déclinaison solaire.
- **Ligne 8** : `asr: 0` : Aucun décalage ajouté à l'Asr.
- **Ligne 9** : `maghrib: 1` : Ajoute **+1 minute** de précaution après la disparition complète du disque solaire sous l'horizon avant d'annoncer la rupture du jeûne et la prière de Maghrib.
- **Ligne 10** : `isha: 0` : Aucun décalage ajouté à l'Isha.
- **Ligne 11** : Fermeture de l'objet `adjustments`.

```javascript
12:   // Alias de rétrocompatibilité
13:   get adjustements() {
14:     return this.adjustments;
15:   },
```
- **Ligne 12-15** : Définit un getter getter `adjustements` (avec un 'e'). Si un code historique ou externe tente d'accéder à l'ancienne orthographe erronée `adjustements`, il renvoie automatiquement la référence vers `this.adjustments`, empêchant tout crash de type `TypeError`.

```javascript
16:   asrFactor: 1,
```
- **Ligne 16** : Facteur de calcul de l'ombre pour la prière de l'**Asr**. Selon l'école jurisprudentielle **Malékite** (ainsi que Chaféite et Hanbalite), le temps de l'Asr entre lorsque la longueur de l'ombre d'un bâton vertical devient égale à la longueur du bâton lui-même plus l'ombre à midi (facteur $= 1$). *(À titre de comparaison, l'école Hanafite utilise un facteur $= 2$)*.

```javascript
17:   timezone: 1,
```
- **Ligne 17** : Fuseau horaire officiel de l'Algérie, fixé à **UTC+1** (West Africa Time / CET). L'Algérie n'applique pas l'heure d'été (*Daylight Saving Time*), ce paramètre est donc permanent toute l'année.

```javascript
18:   name: "Méthode Algérienne (Ministère des Affaires religieuses)",
```
- **Ligne 18** : Nom descriptif complet de la méthode de calcul, utilisé dans les métadonnées retournées par l'API REST.

```javascript
19:   id: 3,
20: };
```
- **Ligne 19** : Identifiant numérique interne conventionnel attribué à la méthode algérienne.
- **Ligne 20** : Fermeture de l'objet `ALGERIA`.
