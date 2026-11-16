// =====================================================================
//  SERVEUR EXPRESS — API مواقيت الصلاة (méthode algérienne)
// =====================================================================

import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import wilayas from "./data/wilayas.js";
import { calculateMonth, calculatePrayerTimes, getNextPrayer } from "./utils/prayers.js";

const app = express();
const PORT = process.env.PORT || 5000;

// ---- Middlewares ----
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------
//  Fonction utilitaire de recherche d'une wilaya (par code ou nom)
// ---------------------------------------------------------------------
function normalizeText(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Retire les accents
}

export function findWilaya(query) {
  if (query === undefined || query === null) return null;
  const raw = String(query).trim();
  const num = Number(raw);

  // Recherche directe par code numérique
  if (!isNaN(num) && num > 0) {
    const foundByCode = wilayas.find((w) => w.code === num);
    if (foundByCode) return foundByCode;
  }

  // Recherche par code avec padding "01" ou par nom (français ou arabe)
  const normalizedQuery = normalizeText(raw);
  return wilayas.find((w) => {
    return (
      String(w.code) === raw ||
      String(w.code).padStart(2, "0") === raw ||
      normalizeText(w.name) === normalizedQuery ||
      w.name_ar === raw
    );
  }) || null;
}

// ---------------------------------------------------------------------
//  GET / → Accueil & documentation synthétique des routes
// ---------------------------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    name: "Algerian Prayer Times API",
    name_ar: "مواقيت الصلاة في الجزائر",
    version: "1.1.0",
    method: "Méthode Algérienne (Ministère des Affaires Religieuses, 18°/17°)",
    status: "online",
    endpoints: {
      health: "GET /api/health",
      wilayas: "GET /api/wilayas (supporte ?q=recherche)",
      wilayaByCode: "GET /api/wilayas/:code",
      todayPrayerTimes: "GET /api/today/:code",
      nextPrayer: "GET /api/next/:code",
      monthPrayerTimes: "GET /api/prayer-times/:code?month=11&year=2026",
    },
    examples: [
      "/api/wilayas",
      "/api/wilayas/16",
      "/api/today/16",
      "/api/next/16",
      "/api/prayer-times/16?month=11&year=2026",
    ],
  });
});

// ---------------------------------------------------------------------
//  GET /api/health → Statut de l'API
// ---------------------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------
//  GET /api/wilayas → Liste des wilayas (avec filtre optionnel ?q=)
// ---------------------------------------------------------------------
app.get("/api/wilayas", (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json(wilayas);
  }

  const queryNorm = normalizeText(q);
  const filtered = wilayas.filter((w) => {
    return (
      String(w.code) === q.trim() ||
      String(w.code).padStart(2, "0") === q.trim() ||
      normalizeText(w.name).includes(queryNorm) ||
      (w.name_ar && w.name_ar.includes(q.trim()))
    );
  });

  res.json(filtered);
});

// ---------------------------------------------------------------------
//  GET /api/wilayas/:code → Détails d'une wilaya spécifique
// ---------------------------------------------------------------------
app.get("/api/wilayas/:code", (req, res) => {
  const wilaya = findWilaya(req.params.code);
  if (!wilaya) {
    return res.status(404).json({
      error: `Wilaya '${req.params.code}' introuvable.`,
    });
  }
  res.json(wilaya);
});

// ---------------------------------------------------------------------
//  GET /api/today/:code → Horaires du jour, prière actuelle et suivante
// ---------------------------------------------------------------------
app.get("/api/today/:code", (req, res) => {
  try {
    const wilaya = findWilaya(req.params.code);
    if (!wilaya) {
      return res.status(404).json({
        error: `Wilaya '${req.params.code}' introuvable.`,
      });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const dateFormatted = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const times = calculatePrayerTimes({
      year,
      month,
      day,
      latitude: wilaya.lat,
      longitude: wilaya.lng,
    });

    const nextInfo = getNextPrayer(times, now);

    res.json({
      wilaya: {
        code: wilaya.code,
        name: wilaya.name,
        name_ar: wilaya.name_ar,
        lat: wilaya.lat,
        lng: wilaya.lng,
      },
      date: dateFormatted,
      times,
      currentPrayer: nextInfo.current,
      nextPrayer: nextInfo.next,
      remainingMinutes: nextInfo.remainingMinutes,
      remainingFormatted: nextInfo.remainingFormatted,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
//  GET /api/next/:code → Prochaine prière et compte à rebours
// ---------------------------------------------------------------------
app.get("/api/next/:code", (req, res) => {
  try {
    const wilaya = findWilaya(req.params.code);
    if (!wilaya) {
      return res.status(404).json({
        error: `Wilaya '${req.params.code}' introuvable.`,
      });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    const times = calculatePrayerTimes({
      year,
      month,
      day,
      latitude: wilaya.lat,
      longitude: wilaya.lng,
    });

    const nextInfo = getNextPrayer(times, now);

    res.json({
      wilaya: {
        code: wilaya.code,
        name: wilaya.name,
        name_ar: wilaya.name_ar,
      },
      ...nextInfo,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
//  GET /api/prayer-times/:code?month=&year= → Calendrier mensuel
// ---------------------------------------------------------------------
app.get("/api/prayer-times/:code", (req, res) => {
  try {
    const wilaya = findWilaya(req.params.code);
    if (!wilaya) {
      return res.status(404).json({
        error: `Wilaya '${req.params.code}' introuvable.`,
      });
    }

    const today = new Date();
    const month = parseInt(req.query.month, 10) || today.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || today.getFullYear();

    // Validation des paramètres
    if (isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: "Mois invalide (doit être compris entre 1 et 12)" });
    }
    if (isNaN(year) || year < 1900 || year > 2100) {
      return res.status(400).json({ error: "Année invalide (doit être comprise entre 1900 et 2100)" });
    }

    // Filtrage optionnel par jour précis (?day=)
    if (req.query.day) {
      const day = parseInt(req.query.day, 10);
      const daysInMonth = new Date(year, month, 0).getDate();
      if (isNaN(day) || day < 1 || day > daysInMonth) {
        return res.status(400).json({
          error: `Jour invalide pour le mois ${month}/${year} (1-${daysInMonth})`,
        });
      }

      const times = calculatePrayerTimes({
        year,
        month,
        day,
        latitude: wilaya.lat,
        longitude: wilaya.lng,
      });

      return res.json({
        wilaya: {
          code: wilaya.code,
          name: wilaya.name,
          name_ar: wilaya.name_ar,
        },
        date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        day,
        month,
        year,
        times,
      });
    }

    const days = calculateMonth({
      year,
      month,
      latitude: wilaya.lat,
      longitude: wilaya.lng,
    });

    res.json({
      wilaya: {
        code: wilaya.code,
        name: wilaya.name,
        name_ar: wilaya.name_ar,
      },
      month,
      year,
      method: "Algérienne (Ministère des Affaires Religieuses, 18°/17°)",
      totalDays: days.length,
      days,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
//  Middleware 404 (Route inconnue)
// ---------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.url} non trouvée.`,
    availableEndpoints: [
      "/",
      "/api/health",
      "/api/wilayas",
      "/api/wilayas/:code",
      "/api/today/:code",
      "/api/next/:code",
      "/api/prayer-times/:code",
    ],
  });
});

// ---------------------------------------------------------------------
//  Middleware de gestion globale des erreurs
// ---------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error("Erreur non interceptée :", err);
  res.status(500).json({
    error: "Erreur interne du serveur",
    message: err.message,
  });
});

// ---- Démarrage ----
const isDirectRun =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url).toLowerCase() === process.argv[1].toLowerCase();

let server;
if (isDirectRun) {
  server = app.listen(PORT, () => {
    console.log(`🚀 API مواقيت الصلاة prête sur http://localhost:${PORT}`);
  });
}

export { app, server };

