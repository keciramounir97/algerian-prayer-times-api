# Documentation Détaillée : `data/wilayas.js`

Ce fichier constitue la base de données géographique locale du projet. Il recense les coordonnées géodésiques et les dénominations officielles bilingues (français et arabe) des 58 wilayas d'Algérie ainsi que des 11 circonscriptions administratives déléguées (codes 59 à 69).

---

## 1. Structure du Modèle de Données

Chaque entrée du tableau `wilayas` est un objet JavaScript structuré comme suit :

```javascript
{
  code: 16,                    // Identifiant numérique officiel de la wilaya
  name: "Alger",               // Nom français usuel de la wilaya
  name_ar: "الجزائر",           // Nom officiel en langue arabe
  lat: 36.7538,                // Latitude géographique décimale (Nord > 0)
  lng: 3.0588                  // Longitude géographique décimale (Est > 0, Ouest < 0)
}
```

### Rôle de chaque attribut :
1. **`code` (`number`)** :
   - Numéro officiel de wilaya attribué par le découpage administratif algérien (1 à 48 pour le découpage historique de 1984, 49 à 58 pour le découpage de 2019/2021, et 59 à 69 pour les wilayas déléguées récentes telles que Boussaâda, Aflou, Barika, etc.).
   - Utilisé comme identifiant primaire dans les routes d'API `/api/today/:code` et `/api/prayer-times/:code`.
2. **`name` (`string`)** :
   - Dénomination en caractères latins, avec accents français éventuels (ex : `Béjaïa`, `Tébessa`, `Sétif`, `M'Sila`).
   - Normalisé dans les recherches par `findWilaya` (insensible à la casse et aux accents).
3. **`name_ar` (`string`)** :
   - Dénomination officielle en arabe (ex : `الجزائر`, `وهران`, `قسنطينة`, `غرداية`).
   - Permet la recherche directe en arabe et l'affichage dans les applications arabophones.
4. **`lat` (`number`)** :
   - Latitude en degrés décimaux du chef-lieu de la wilaya.
   - Paramètre clé dans le calcul de la hauteur du soleil et de l'angle horaire ($\phi$).
5. **`lng` (`number`)** :
   - Longitude en degrés décimaux par rapport au méridien de Greenwich.
   - Paramètre clé déterminant le décalage local par rapport au midi moyen ($-\text{lng} / 15$).

---

## 2. Découpage et Catégories Couvertes

Le fichier couvre **69 localités et circonscriptions administratives** réparties sur le territoire national :

### A. Les 48 Wilayas Historiques (1984)
- De `1` (Adrar) à `48` (Ghardaïa), incluant les grandes métropoles :
  - `09` : Blida
  - `16` : Alger
  - `25` : Constantine
  - `31` : Oran
  - `13` : Tlemcen
  - `23` : Annaba
  - `19` : Sétif

### B. Les 10 Nouvelles Wilayas du Sud (Loi 19-12 / 2019-2021)
- `49` : Timimoun
- `50` : Bordj Badji Mokhtar
- `51` : Ouled Djellal
- `52` : Béni Abbès
- `53` : In Salah
- `54` : In Guezzam
- `55` : Touggourt
- `56` : Djanet
- `57` : El M'Ghair
- `58` : El Meniaa

### C. Les 11 Wilayas Déléguées Récemment Promues (2023-2024)
- `59` : Aflou (أفلو)
- `60` : Barika (بريكة)
- `61` : El Kantara (القنطرة)
- `62` : Bir El Ater (بئر العاتر)
- `63` : El Aricha (العريشة)
- `64` : Ksar Chellala (قصر الشلالة)
- `65` : Aïn Ouessara (عين وسارة)
- `66` : Messaad (مسعد)
- `67` : Ksar El Boukhari (قصر البخاري)
- `68` : Bou Saâda (بوسعادة)
- `69` : El Abiodh Sidi Cheikh (الأبيض سيدي الشيخ)

---

## 3. Exportation ES Module

```javascript
export default wilayas;
```
L'export par défaut `export default wilayas` permet une intégration directe et performante en mémoire sans nécessiter de base de données SQL ou NoSQL externe, offrant des temps de réponse inférieurs à la milliseconde pour les requêtes d'API.
