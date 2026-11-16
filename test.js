// =====================================================================
//  SUITE DE TESTS AUTOMATISÉS — API مواقيت الصلاة
// =====================================================================

process.env.NODE_ENV = "test";

import assert from "node:assert";
import { app, findWilaya } from "./server.js";
import { calculatePrayerTimes, calculateMonth, getNextPrayer } from "./utils/prayers.js";
import { julianDay, sunPosition, solarNoon } from "./utils/astronomy.js";

async function runTests() {
  console.log("▶ Démarrage de la suite de tests...\n");
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    -> ${err.message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------
  // 1. Tests Module Astronomique
  // -------------------------------------------------------------------
  console.log("--- 1. Module Astronomique & Formules Meeus ---");

  test("Calcul du Jour Julien (epoch J2000)", () => {
    const jd = julianDay(2000, 1, 1);
    assert.strictEqual(jd, 2451544.5);
  });

  test("Position du Soleil & Équation du temps dans la plage valide (-15m à +17m)", () => {
    const jd = julianDay(2026, 11, 16);
    const { declinaison, eqTime } = sunPosition(jd);
    assert.ok(declinaison < 0, "Déclinaison en novembre doit être négative");
    assert.ok(eqTime > 14 && eqTime < 17, `Equation du temps en novembre doit être ~15 min (reçu: ${eqTime})`);
  });

  test("Midi Solaire pour Alger (~12h32 à 12h34 en mi-novembre)", () => {
    const jd = julianDay(2026, 11, 16);
    const noon = solarNoon(jd, 3.0588, 1);
    assert.ok(noon > 12.45 && noon < 12.65, `Midi solaire à Alger doit être vers 12:33 (reçu: ${noon})`);
  });

  // -------------------------------------------------------------------
  // 2. Tests Calculs des Horaires de Prière (Méthode Algérienne)
  // -------------------------------------------------------------------
  console.log("\n--- 2. Calcul des Horaires de Prière ---");

  test("Calcul des 5 prières pour Alger (16 novembre)", () => {
    const times = calculatePrayerTimes({
      year: 2026,
      month: 11,
      day: 16,
      latitude: 36.7538,
      longitude: 3.0588,
    });

    assert.ok(times.fajr.match(/^\d{2}:\d{2}$/));
    assert.ok(times.sunrise.match(/^\d{2}:\d{2}$/));
    assert.ok(times.dhuhr.match(/^\d{2}:\d{2}$/));
    assert.ok(times.asr.match(/^\d{2}:\d{2}$/));
    assert.ok(times.maghrib.match(/^\d{2}:\d{2}$/));
    assert.ok(times.isha.match(/^\d{2}:\d{2}$/));

    // Vérification de la chronologie logique : Fajr < Sunrise < Dhuhr < Asr < Maghrib < Isha
    assert.ok(times.fajr < times.sunrise, "Fajr doit précéder le lever");
    assert.ok(times.sunrise < times.dhuhr, "Le lever doit précéder Dhuhr");
    assert.ok(times.dhuhr < times.asr, "Dhuhr doit précéder Asr");
    assert.ok(times.asr < times.maghrib, "Asr doit précéder Maghrib");
    assert.ok(times.maghrib < times.isha, "Maghrib doit précéder Isha");
  });

  test("Calcul pour un mois complet (nombre de jours exact)", () => {
    const daysFev = calculateMonth({ year: 2024, month: 2, latitude: 36.75, longitude: 3.05 });
    assert.strictEqual(daysFev.length, 29, "Février 2024 doit avoir 29 jours");

    const daysNov = calculateMonth({ year: 2026, month: 11, latitude: 36.75, longitude: 3.05 });
    assert.strictEqual(daysNov.length, 30, "Novembre doit avoir 30 jours");
  });

  test("Logique getNextPrayer (détermination de la prochaine prière et compte à rebours)", () => {
    const sampleTimes = {
      fajr: "05:30",
      sunrise: "07:00",
      dhuhr: "12:30",
      asr: "15:30",
      maghrib: "18:00",
      isha: "19:30",
    };

    // Cas 1 : Milieu de journée (14h00) -> Prochaine doit être Asr (15h30)
    const midday = new Date("2026-11-16T14:00:00");
    const res1 = getNextPrayer(sampleTimes, midday);
    assert.strictEqual(res1.current.key, "dhuhr");
    assert.strictEqual(res1.next.key, "asr");
    assert.strictEqual(res1.remainingMinutes, 90);
    assert.strictEqual(res1.remainingFormatted, "01h 30m");

    // Cas 2 : Après Isha (22h00) -> Prochaine doit être Fajr de demain
    const night = new Date("2026-11-16T22:00:00");
    const res2 = getNextPrayer(sampleTimes, night);
    assert.strictEqual(res2.current.key, "isha");
    assert.strictEqual(res2.next.key, "fajr");
    assert.strictEqual(res2.next.isTomorrow, true);
    assert.strictEqual(res2.remainingMinutes, (2 * 60) + (5 * 60 + 30));
  });

  // -------------------------------------------------------------------
  // 3. Tests Recherche de Wilaya (Résolution Flexible)
  // -------------------------------------------------------------------
  console.log("\n--- 3. Recherche et Résolution de Wilaya ---");

  test("Recherche par code entier (16 -> Alger)", () => {
    const w = findWilaya(16);
    assert.ok(w);
    assert.strictEqual(w.name, "Alger");
  });

  test("Recherche par string numérique ('16')", () => {
    const w = findWilaya("16");
    assert.ok(w);
    assert.strictEqual(w.name, "Alger");
  });

  test("Recherche par code avec zéro ('01' -> Adrar)", () => {
    const w = findWilaya("01");
    assert.ok(w);
    assert.strictEqual(w.name, "Adrar");
  });

  test("Recherche par nom français sans casse ('oran' -> Oran)", () => {
    const w = findWilaya("oran");
    assert.ok(w);
    assert.strictEqual(w.code, 31);
  });

  test("Recherche par nom français avec accent insensible ('bejaia' -> Béjaïa)", () => {
    const w = findWilaya("bejaia");
    assert.ok(w);
    assert.strictEqual(w.code, 6);
  });

  test("Recherche par nom arabe ('قسنطينة' -> Constantine)", () => {
    const w = findWilaya("قسنطينة");
    assert.ok(w);
    assert.strictEqual(w.code, 25);
  });

  test("Recherche avec code inexistant ('999' -> null)", () => {
    const w = findWilaya("999");
    assert.strictEqual(w, null);
  });

  // -------------------------------------------------------------------
  // 4. Tests Appels HTTP Endpoints API
  // -------------------------------------------------------------------
  console.log("\n--- 4. Tests des Endpoints API HTTP (Serveur Test) ---");

  const testServer = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const port = testServer.address().port;
  const baseUrl = `http://localhost:${port}`;

  const fetchJson = async (path) => {
    const res = await fetch(`${baseUrl}${path}`);
    const data = await res.json();
    return { status: res.status, data };
  };

  try {
    // GET /
    const root = await fetchJson("/");
    test("Endpoint GET / retourne statut 200 et description API", () => {
      assert.strictEqual(root.status, 200);
      assert.strictEqual(root.data.status, "online");
    });

    // GET /api/health
    const health = await fetchJson("/api/health");
    test("Endpoint GET /api/health retourne statut ok", () => {
      assert.strictEqual(health.status, 200);
      assert.strictEqual(health.data.status, "ok");
    });

    // GET /api/wilayas
    const allWilayas = await fetchJson("/api/wilayas");
    test("Endpoint GET /api/wilayas liste toutes les wilayas", () => {
      assert.strictEqual(allWilayas.status, 200);
      assert.ok(Array.isArray(allWilayas.data));
      assert.ok(allWilayas.data.length >= 58);
    });

    // GET /api/wilayas?q=alger
    const queryWilayas = await fetchJson("/api/wilayas?q=alger");
    test("Endpoint GET /api/wilayas?q=alger filtre correctement", () => {
      assert.strictEqual(queryWilayas.status, 200);
      assert.ok(queryWilayas.data.some((w) => w.code === 16));
    });

    // GET /api/wilayas/16
    const wilaya16 = await fetchJson("/api/wilayas/16");
    test("Endpoint GET /api/wilayas/16 retourne la wilaya d'Alger", () => {
      assert.strictEqual(wilaya16.status, 200);
      assert.strictEqual(wilaya16.data.name, "Alger");
      assert.strictEqual(wilaya16.data.code, 16);
    });

    // GET /api/today/16
    const today16 = await fetchJson("/api/today/16");
    test("Endpoint GET /api/today/16 retourne les horaires et la prochaine prière", () => {
      assert.strictEqual(today16.status, 200);
      assert.strictEqual(today16.data.wilaya.code, 16);
      assert.ok(today16.data.times.fajr);
      assert.ok(today16.data.nextPrayer);
    });

    // GET /api/next/31
    const next31 = await fetchJson("/api/next/31");
    test("Endpoint GET /api/next/31 retourne le compte à rebours pour Oran", () => {
      assert.strictEqual(next31.status, 200);
      assert.strictEqual(next31.data.wilaya.code, 31);
      assert.ok(next31.data.next);
      assert.ok(typeof next31.data.remainingMinutes === "number");
    });

    // GET /api/prayer-times/16?month=11&year=2026
    const timesMonth = await fetchJson("/api/prayer-times/16?month=11&year=2026");
    test("Endpoint GET /api/prayer-times/16?month=11&year=2026 retourne le mois complet", () => {
      assert.strictEqual(timesMonth.status, 200);
      assert.strictEqual(timesMonth.data.days.length, 30);
    });

    // GET /api/prayer-times/16?month=11&year=2026&day=5
    const specificDay = await fetchJson("/api/prayer-times/16?month=11&year=2026&day=5");
    test("Endpoint GET /api/prayer-times/16?day=5 retourne un jour spécifique", () => {
      assert.strictEqual(specificDay.status, 200);
      assert.strictEqual(specificDay.data.day, 5);
      assert.ok(specificDay.data.times.fajr);
    });

    // Erreur 404 sur wilaya inexistante
    const badWilaya = await fetchJson("/api/today/999");
    test("Endpoint GET /api/today/999 retourne 404", () => {
      assert.strictEqual(badWilaya.status, 404);
      assert.ok(badWilaya.data.error);
    });

    // Erreur 400 sur mois invalide
    const badMonth = await fetchJson("/api/prayer-times/16?month=15");
    test("Endpoint GET /api/prayer-times/16?month=15 retourne 400", () => {
      assert.strictEqual(badMonth.status, 400);
      assert.ok(badMonth.data.error);
    });

    // Middleware 404 pour route inexistante
    const notFoundRoute = await fetchJson("/api/route-qui-nexiste-pas");
    test("Route inconnue retourne 404 avec endpoints suggérés", () => {
      assert.strictEqual(notFoundRoute.status, 404);
      assert.ok(notFoundRoute.data.availableEndpoints);
    });

  } finally {
    testServer.close();
  }

  // -------------------------------------------------------------------
  // Résumé
  // -------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(`Résultats finaux : ${passed} passés, ${failed} échoués`);
  console.log("=======================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
