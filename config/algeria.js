export const ALGERIA = {
  fajrAngle: 18.0,
  ishaAngle: 17.0,
  adjustments: {
    fajr: 0,
    sunrise: 0,
    dhuhr: 1,
    asr: 0,
    maghrib: 1,
    isha: 0,
  },
  // Alias de rétrocompatibilité
  get adjustements() {
    return this.adjustments;
  },
  asrFactor: 1,
  timezone: 1,
  name: "Méthode Algérienne (Ministère des Affaires religieuses)",
  id: 3,
};
