const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  formatInputDate,
  parseLocalDate,
  addDays,
  isValidLocalDate,
  formatDisplayDate,
  isSessionValid,
  getDayMinutesByDate,
  getIntensityLevel,
  getHeatmapStartMonday,
  buildHeatmap,
  getDayLabel,
} = require("../logic.js");

// Ayuda: convierte "AAAA-MM-DD" a milisegundos UTC solo para comparar días.
function toUtc(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function flatten(weeks) {
  return weeks.flat();
}

function findCell(weeks, date) {
  return flatten(weeks).find((cell) => cell.date === date);
}

// --- Fechas locales (RF-3, NFR-4) -------------------------------------------------

test("formatInputDate usa la fecha local, no UTC", () => {
  const date = new Date(2026, 9, 16, 0, 30); // 16 de octubre de 2026, 00:30 local
  assert.equal(formatInputDate(date), "2026-10-16");
});

test("parseLocalDate y formatInputDate hacen ida y vuelta", () => {
  assert.equal(formatInputDate(parseLocalDate("2026-10-16")), "2026-10-16");
});

test("isValidLocalDate acepta fechas reales y rechaza el resto", () => {
  assert.equal(isValidLocalDate("2026-10-16"), true);
  assert.equal(isValidLocalDate("2026-02-30"), false); // fecha imposible
  assert.equal(isValidLocalDate("2026-13-01"), false); // mes imposible
  assert.equal(isValidLocalDate("16-10-2026"), false); // formato incorrecto
  assert.equal(isValidLocalDate("2026-1-1"), false); // sin ceros
  assert.equal(isValidLocalDate(""), false);
  assert.equal(isValidLocalDate(null), false);
});

test("addDays suma y resta días de calendario", () => {
  assert.equal(formatInputDate(addDays(parseLocalDate("2026-10-31"), 1)), "2026-11-01");
  assert.equal(formatInputDate(addDays(parseLocalDate("2026-01-01"), -1)), "2025-12-31");
});

test("formatDisplayDate muestra DD-MM-YYYY con es-AR", () => {
  assert.equal(formatDisplayDate("2026-10-16"), "16-10-2026");
});

// --- Validación de sesiones (RF-3, RF-8) ------------------------------------------

test("isSessionValid exige fecha local válida y minutos entero > 0", () => {
  assert.equal(isSessionValid({ date: "2026-10-16", minutes: 45 }), true);
  assert.equal(isSessionValid({ date: "2026-02-30", minutes: 45 }), false);
  assert.equal(isSessionValid({ date: "2026-10-16", minutes: 0 }), false);
  assert.equal(isSessionValid({ date: "2026-10-16", minutes: -5 }), false);
  assert.equal(isSessionValid({ date: "2026-10-16", minutes: 10.5 }), false);
  assert.equal(isSessionValid({ date: "2026-10-16" }), false);
  assert.equal(isSessionValid(null), false);
});

test("getDayMinutesByDate suma por día e ignora sesiones inválidas", () => {
  const sessions = [
    { date: "2026-10-16", minutes: 45 },
    { date: "2026-10-16", minutes: 30 },
    { date: "2026-10-15", minutes: 20 },
    { date: "dato-roto", minutes: 10 },
    { date: "2026-10-14", minutes: 0 },
    { date: "2026-10-13", minutes: -5 },
  ];
  const totals = getDayMinutesByDate(sessions);
  assert.equal(totals.get("2026-10-16"), 75);
  assert.equal(totals.get("2026-10-15"), 20);
  assert.equal(totals.has("2026-10-14"), false);
  assert.equal(totals.has("2026-10-13"), false);
  assert.equal(totals.has("dato-roto"), false);
});

// --- Niveles de intensidad (RF-4) -------------------------------------------------

test("getIntensityLevel respeta los límites exactos", () => {
  assert.equal(getIntensityLevel(0), 0);
  assert.equal(getIntensityLevel(1), 1);
  assert.equal(getIntensityLevel(29), 1);
  assert.equal(getIntensityLevel(30), 2);
  assert.equal(getIntensityLevel(59), 2);
  assert.equal(getIntensityLevel(60), 3);
  assert.equal(getIntensityLevel(119), 3);
  assert.equal(getIntensityLevel(120), 4);
  assert.equal(getIntensityLevel(600), 4);
});

// --- Inicio del período (RF-2) ----------------------------------------------------

test("getHeatmapStartMonday devuelve el lunes de hace 11 semanas", () => {
  const start = getHeatmapStartMonday("2026-10-16"); // viernes
  assert.equal(formatInputDate(start), "2026-07-27");
  assert.equal(start.getDay(), 1); // lunes
});

// --- Rejilla del mapa (RF-2, RF-3, RF-4, RF-5, RF-8) ------------------------------

test("buildHeatmap devuelve 12 columnas de 7 celdas, empezando en lunes", () => {
  const weeks = buildHeatmap([], "2026-10-16");
  assert.equal(weeks.length, 12);
  weeks.forEach((week) => assert.equal(week.length, 7));
  assert.equal(weeks[0][0].date, "2026-07-27"); // primera celda: lunes
  assert.equal(parseLocalDate(weeks[0][0].date).getDay(), 1);
  // La última columna contiene "hoy".
  assert.ok(weeks[11].some((cell) => cell.date === "2026-10-16"));
});

test("buildHeatmap asigna niveles según los minutos del día", () => {
  const sessions = [
    { date: "2026-10-16", minutes: 45 }, // hoy -> nivel 2
    { date: "2026-10-15", minutes: 90 }, // ayer -> nivel 3
    { date: "2026-10-14", minutes: 20 }, // anteayer -> nivel 1
  ];
  const weeks = buildHeatmap(sessions, "2026-10-16");
  assert.equal(findCell(weeks, "2026-10-16").level, 2);
  assert.equal(findCell(weeks, "2026-10-15").level, 3);
  assert.equal(findCell(weeks, "2026-10-14").level, 1);
  assert.equal(findCell(weeks, "2026-10-14").minutes, 20);
});

test("buildHeatmap marca los días futuros y no les da nivel", () => {
  const weeks = buildHeatmap([], "2026-10-16");
  const tomorrow = findCell(weeks, "2026-10-17");
  assert.equal(tomorrow.isFuture, true);
  assert.equal(tomorrow.level, null);
  const today = findCell(weeks, "2026-10-16");
  assert.equal(today.isFuture, false);
  assert.equal(today.level, 0);
});

test("buildHeatmap ignora una sesión con fecha futura", () => {
  const weeks = buildHeatmap([{ date: "2026-10-17", minutes: 100 }], "2026-10-16");
  const cell = findCell(weeks, "2026-10-17");
  assert.equal(cell.isFuture, true);
  assert.equal(cell.level, null);
  assert.equal(cell.minutes, 0);
});

test("buildHeatmap ignora las sesiones fuera del período", () => {
  const weeks = buildHeatmap([{ date: "2020-01-01", minutes: 100 }], "2026-10-16");
  assert.equal(findCell(weeks, "2020-01-01"), undefined);
  // Todos los días transcurridos quedan en nivel 0.
  const past = flatten(weeks).filter((cell) => !cell.isFuture);
  assert.ok(past.every((cell) => cell.level === 0));
});

test("buildHeatmap sin sesiones muestra todos los días transcurridos en nivel 0", () => {
  const weeks = buildHeatmap([], "2026-10-16");
  const past = flatten(weeks).filter((cell) => !cell.isFuture);
  assert.ok(past.length > 0);
  assert.ok(past.every((cell) => cell.level === 0 && cell.minutes === 0));
});

test("la rejilla de 84 días es contigua, sin huecos ni repetidos", () => {
  const weeks = buildHeatmap([], "2026-10-16");
  const days = flatten(weeks).map((cell) => cell.date);
  assert.equal(days.length, 84);
  assert.equal(new Set(days).size, 84);
  for (let i = 1; i < days.length; i += 1) {
    assert.equal(toUtc(days[i]) - toUtc(days[i - 1]), 86400000);
  }
});

test("la rejilla cruza el cambio de hora sin huecos", () => {
  ["2026-04-05", "2026-11-01"].forEach((today) => {
    const days = flatten(buildHeatmap([], today)).map((cell) => cell.date);
    assert.equal(new Set(days).size, 84);
    for (let i = 1; i < days.length; i += 1) {
      assert.equal(toUtc(days[i]) - toUtc(days[i - 1]), 86400000);
    }
  });
});

test("la rejilla cruza el cambio de año", () => {
  const weeks = buildHeatmap([], "2026-01-05"); // 5 de enero de 2026, lunes
  assert.equal(weeks[0][0].date, "2025-10-20");
  assert.equal(findCell(weeks, "2026-01-05").isFuture, false);
});

test("CL-10: varias sesiones del mismo día determinan el nivel por la suma", () => {
  const sessions = [
    { date: "2026-10-13", minutes: 20 },
    { date: "2026-10-13", minutes: 20 }, // 40 min en total: cruzan el umbral de nivel 1 a 2
  ];
  const cell = findCell(buildHeatmap(sessions, "2026-10-16"), "2026-10-13");
  assert.equal(cell.minutes, 40);
  assert.equal(cell.level, 2);
  assert.equal(getIntensityLevel(20), 1); // cada sesión por separado sería nivel 1
});

test("CL-19: sesiones con el mismo id no se fusionan y suman sus minutos", () => {
  const sessions = [
    { id: "duplicada", date: "2026-10-12", minutes: 30 },
    { id: "duplicada", date: "2026-10-12", minutes: 45 },
  ];
  const cell = findCell(buildHeatmap(sessions, "2026-10-16"), "2026-10-12");
  assert.equal(cell.minutes, 75);
  assert.equal(cell.level, 3);
});

// --- Etiqueta de un día (RF-7, NFR-2) ---------------------------------------------

test("getDayLabel describe el día en texto", () => {
  assert.equal(
    getDayLabel({ date: "2026-10-16", minutes: 45, level: 2, isFuture: false }),
    "16-10-2026, 45 minutos"
  );
  assert.equal(
    getDayLabel({ date: "2026-10-15", minutes: 0, level: 0, isFuture: false }),
    "15-10-2026 (sin estudio)"
  );
  assert.equal(
    getDayLabel({ date: "2026-10-17", minutes: 0, level: null, isFuture: true }),
    "17-10-2026 (día futuro)"
  );
});
