// =====================================================================
//  MODULE ASTRONOMIQUE
//  Calcule la position du soleil — formules de Jean Meeus
// =====================================================================

export const deg2rad = (d) => (d * Math.PI) / 180;
export const rad2deg = (r) => (r * 180) / Math.PI;
export const normalize360 = (d) => ((d % 360) + 360) % 360;
export const normalize180 = (d) => {
  const x = normalize360(d);
  return x > 180 ? x - 360 : x;
};

// Jour julien à 0h UT
export function julianDay(year, month, day) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    B -
    1524.5
  );
}

// Position du soleil (déclinaison + équation du temps)
export function sunPosition(jd) {
  const T = (jd - 2451545.0) / 36525;
  const L0 = normalize360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = normalize360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const Mr = deg2rad(M);

  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) +
    0.000289 * Math.sin(3 * Mr);

  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(deg2rad(omega));

  const epsilon0 =
    23 +
    (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const epsilon = epsilon0 + 0.00256 * Math.cos(deg2rad(omega));

  const declinaison = rad2deg(
    Math.asin(Math.sin(deg2rad(epsilon)) * Math.sin(deg2rad(lambda))),
  );

  const alpha = rad2deg(
    Math.atan2(
      Math.cos(deg2rad(epsilon)) * Math.sin(deg2rad(lambda)),
      Math.cos(deg2rad(lambda)),
    ),
  );

  // Equation du temps en minutes : E = 4 * (L0 - alpha)
  const eqTime = 4 * normalize180(L0 - 0.0057183 - alpha);

  return { declinaison, eqTime };
}

// Angle horaire pour une altitude donnée
export function hourAngle(altitude, latitude, declinaison) {
  const latR = deg2rad(latitude);
  const decR = deg2rad(declinaison);
  const altR = deg2rad(altitude);

  const cosH =
    (Math.sin(altR) - Math.sin(latR) * Math.sin(decR)) /
    (Math.cos(latR) * Math.cos(decR));

  if (cosH > 1 || cosH < -1) return null;
  return rad2deg(Math.acos(cosH));
}

// Midi solaire vrai (en heures décimales en heure locale standard)
// Correction fondamentale : T_midi = 12 - (Longitude / 15) + Timezone - (Equation du temps / 60)
export function solarNoon(jd, longitude, timezone) {
  return 12 - longitude / 15 + timezone - sunPosition(jd).eqTime / 60;
}

// Angle horaire → heure locale
export function timeFromAngle(jd, longitude, timezone, H, isMorning) {
  const noon = solarNoon(jd, longitude, timezone);
  const offset = H / 15;
  return isMorning ? noon - offset : noon + offset;
}
