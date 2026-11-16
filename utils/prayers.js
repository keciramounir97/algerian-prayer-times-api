// =====================================================================
//  CALCUL DES HORAIRES DE PRIÈRE — MÉTHODE ALGÉRIENNE
//  -------------------------------------------------------------------
//  Config officielle (Ministère des Affaires Religieuses) :
//    Fajr  = -18°  sous l'horizon
//    Isha  = -17°  sous l'horizon
//    Asr   = facteur 1 (école Maliki)
//    Timezone = UTC+1 (pas de DST en Algérie)
// =====================================================================

import {
  julianDay,
  sunPosition,
  hourAngle,
  solarNoon,
  timeFromAngle,
  rad2deg,
  deg2rad,
} from "./astronomy.js";

// ---- Configuration algérienne (figée) ----
import { ALGERIA } from "../config/algeria.js";

// Altitude du lever/coucher : -0.833° (réfraction atmosphérique + demi-diamètre solaire)
const SUNRISE_ALT = -0.833;

// ---------------------------------------------------------------------
//  FORMATAGE : 5.25 → "05:15"
// ---------------------------------------------------------------------
export function formatTime(hours) {
  if (hours === null || isNaN(hours)) return "—";
  let h = ((hours % 24) + 24) % 24;
  const totalMin = Math.round(h * 60);
  const hh = Math.floor(totalMin / 60) % 24;
  const mm = totalMin % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------
//  Application d'un ajustement en minutes
// ---------------------------------------------------------------------
export function applyAdjustment(hours, minutes = 0) {
  if (hours === null || isNaN(hours)) return null;
  return hours + (minutes || 0) / 60;
}

// ---------------------------------------------------------------------
//  CALCUL PRINCIPAL : horaires d'un jour pour un lieu
// ---------------------------------------------------------------------
export function calculatePrayerTimes({
  year,
  month,
  day,
  latitude,
  longitude,
}) {
  const cfg = ALGERIA;
  const adjustments = cfg.adjustments || cfg.adjustements || {};

  // 1. Jour julien
  const jd = julianDay(year, month, day);

  // 2. Position du soleil
  const { declinaison } = sunPosition(jd);

  // 3. Midi solaire vrai
  const noon = solarNoon(jd, longitude, cfg.timezone);

  // 4. Angles horaires
  const H_fajr = hourAngle(-cfg.fajrAngle, latitude, declinaison);
  const H_sunrise = hourAngle(SUNRISE_ALT, latitude, declinaison);
  const H_isha = hourAngle(-cfg.ishaAngle, latitude, declinaison);

  // 5. Angle horaire de Asr (école Maliki : ombre de l'objet = sa taille)
  //    altitude = atan(1 / (facteur + tan|lat - declinaison|))
  const asrAlt = rad2deg(
    Math.atan(
      1 / (cfg.asrFactor + Math.tan(deg2rad(Math.abs(latitude - declinaison)))),
    ),
  );
  const H_asr = hourAngle(asrAlt, latitude, declinaison);

  // 6. Calcul brut des heures décimales
  let fajr =
    H_fajr !== null
      ? timeFromAngle(jd, longitude, cfg.timezone, H_fajr, true)
      : null;
  let sunrise =
    H_sunrise !== null
      ? timeFromAngle(jd, longitude, cfg.timezone, H_sunrise, true)
      : null;
  let dhuhr = noon;
  let asr =
    H_asr !== null
      ? timeFromAngle(jd, longitude, cfg.timezone, H_asr, false)
      : null;
  let maghrib =
    H_sunrise !== null
      ? timeFromAngle(jd, longitude, cfg.timezone, H_sunrise, false)
      : null;
  let isha =
    H_isha !== null
      ? timeFromAngle(jd, longitude, cfg.timezone, H_isha, false)
      : null;

  // 7. Règle de secours : latitudes extrêmes / nuit courte
  //    → règle "1/7 de la nuit" recommandée par la ligue islamique mondiale (MWL)
  if (fajr === null && sunrise !== null && maghrib !== null) {
    const nightDur = 24 + sunrise - maghrib;
    fajr = sunrise - nightDur / 7;
  }
  if (isha === null && maghrib !== null && sunrise !== null) {
    const nightDur = 24 + sunrise - maghrib;
    isha = maghrib + nightDur / 7;
  }

  // 8. Application des ajustements officiels (en minutes)
  fajr = applyAdjustment(fajr, adjustments.fajr);
  sunrise = applyAdjustment(sunrise, adjustments.sunrise);
  dhuhr = applyAdjustment(dhuhr, adjustments.dhuhr);
  asr = applyAdjustment(asr, adjustments.asr);
  maghrib = applyAdjustment(maghrib, adjustments.maghrib);
  isha = applyAdjustment(isha, adjustments.isha);

  // 9. Formatage final "HH:mm"
  return {
    fajr: formatTime(fajr),
    sunrise: formatTime(sunrise),
    dhuhr: formatTime(dhuhr),
    asr: formatTime(asr),
    maghrib: formatTime(maghrib),
    isha: formatTime(isha),
  };
}

// ---------------------------------------------------------------------
//  CALCUL POUR UN MOIS ENTIER
// ---------------------------------------------------------------------
export function calculateMonth({ year, month, latitude, longitude }) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const result = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const t = calculatePrayerTimes({ year, month, day, latitude, longitude });
    result.push({
      day,
      date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      ...t,
    });
  }

  return result;
}

// ---------------------------------------------------------------------
//  DÉTERMINATION DE LA PRIÈRE ACTUELLE ET SUIVANTE
// ---------------------------------------------------------------------
export function getNextPrayer(times, date = new Date()) {
  const parseToMinutes = (timeStr) => {
    if (!timeStr || timeStr === "—") return null;
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  const schedule = [
    { key: "fajr", name: "Fajr", name_ar: "الفجر", minutes: parseToMinutes(times.fajr), time: times.fajr },
    { key: "sunrise", name: "Chourouk", name_ar: "الشروق", minutes: parseToMinutes(times.sunrise), time: times.sunrise },
    { key: "dhuhr", name: "Dhuhr", name_ar: "الظهر", minutes: parseToMinutes(times.dhuhr), time: times.dhuhr },
    { key: "asr", name: "Asr", name_ar: "العصر", minutes: parseToMinutes(times.asr), time: times.asr },
    { key: "maghrib", name: "Maghrib", name_ar: "المغرب", minutes: parseToMinutes(times.maghrib), time: times.maghrib },
    { key: "isha", name: "Isha", name_ar: "العشاء", minutes: parseToMinutes(times.isha), time: times.isha },
  ];

  let current = null;
  let next = null;

  for (let i = 0; i < schedule.length; i++) {
    if (schedule[i].minutes !== null && currentMinutes < schedule[i].minutes) {
      next = schedule[i];
      current = i > 0 ? schedule[i - 1] : { ...schedule[schedule.length - 1], note: "from_yesterday" };
      break;
    }
  }

  // Si on a dépassé l'Isha, la prochaine est Fajr de demain
  if (!next) {
    current = schedule[schedule.length - 1]; // Isha
    next = { ...schedule[0], isTomorrow: true }; // Fajr demain
  }

  // Calcul du temps restant en minutes
  let remainingMinutes;
  if (next.minutes >= currentMinutes) {
    remainingMinutes = next.minutes - currentMinutes;
  } else {
    remainingMinutes = (24 * 60 - currentMinutes) + next.minutes;
  }

  const remHours = Math.floor(remainingMinutes / 60);
  const remMins = remainingMinutes % 60;
  const remainingFormatted = `${String(remHours).padStart(2, "0")}h ${String(remMins).padStart(2, "0")}m`;

  return {
    current: {
      key: current.key,
      name: current.name,
      name_ar: current.name_ar,
      time: current.time,
    },
    next: {
      key: next.key,
      name: next.name,
      name_ar: next.name_ar,
      time: next.time,
      isTomorrow: Boolean(next.isTomorrow),
    },
    remainingMinutes,
    remainingFormatted,
  };
}
