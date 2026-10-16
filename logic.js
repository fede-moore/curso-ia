// logic.js — Lógica pura del Diario de Estudio.
// Sin DOM y sin localStorage: mismas entradas, mismo resultado.
// Funciones y variables en inglés; comentarios y textos, en español.

const DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

// --- Fechas locales ---------------------------------------------------------------

// Fecha local -> texto "AAAA-MM-DD".
function formatInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Texto "AAAA-MM-DD" -> Date local a las 00:00 (nunca en UTC).
function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Suma o resta días de calendario (seguro ante cambios de hora).
function addDays(date, amount) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

// Comprueba que el texto es una fecha local real en "AAAA-MM-DD".
function isValidLocalDate(dateString) {
  if (typeof dateString !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }

  return formatInputDate(parseLocalDate(dateString)) === dateString;
}

// Fecha -> "DD-MM-YYYY" con la configuración es-AR.
function formatDisplayDate(dateString) {
  const date = parseLocalDate(dateString);
  return DATE_FORMATTER.formatToParts(date)
    .filter((part) => part.type === "day" || part.type === "month" || part.type === "year")
    .map((part) => part.value)
    .join("-");
}

// --- Sesiones y niveles -----------------------------------------------------------

// Una sesión es válida si su fecha es local y sus minutos son un entero mayor que 0.
function isSessionValid(session) {
  if (!session || typeof session.date !== "string") {
    return false;
  }

  if (!isValidLocalDate(session.date)) {
    return false;
  }

  const minutes = Number(session.minutes);
  return Number.isInteger(minutes) && minutes > 0;
}

// Suma los minutos de las sesiones válidas por día: mapa "AAAA-MM-DD" -> minutos.
function getDayMinutesByDate(sessions) {
  const totals = new Map();

  sessions.forEach((session) => {
    if (!isSessionValid(session)) {
      return;
    }

    const minutes = totals.get(session.date) || 0;
    totals.set(session.date, minutes + Number(session.minutes));
  });

  return totals;
}

// Minutos del día -> nivel 0..4 (0 = sin estudio, 4 = 120 minutos o más).
function getIntensityLevel(minutes) {
  if (minutes <= 0) {
    return 0;
  }
  if (minutes <= 29) {
    return 1;
  }
  if (minutes <= 59) {
    return 2;
  }
  if (minutes <= 119) {
    return 3;
  }
  return 4;
}

// --- Rejilla del mapa -------------------------------------------------------------

// Lunes de inicio: el lunes de hace 11 semanas respecto de la semana de "hoy".
function getHeatmapStartMonday(today) {
  const todayDate = parseLocalDate(today);
  const day = todayDate.getDay(); // 0 = domingo
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  const thisMonday = addDays(todayDate, offsetToMonday);
  return addDays(thisMonday, -77); // 11 semanas = 77 días
}

// Rejilla completa: 12 columnas (semanas) de 7 celdas (lunes..domingo).
// Cada celda es { date, minutes, level, isFuture }. "hoy" llega como parámetro.
function buildHeatmap(sessions, today) {
  const totals = getDayMinutesByDate(sessions);
  const startMonday = getHeatmapStartMonday(today);
  const weeks = [];

  for (let week = 0; week < 12; week += 1) {
    const column = [];

    for (let day = 0; day < 7; day += 1) {
      const date = formatInputDate(addDays(startMonday, week * 7 + day));
      const isFuture = date > today;
      const minutes = isFuture ? 0 : totals.get(date) || 0;
      const level = isFuture ? null : getIntensityLevel(minutes);
      column.push({ date, minutes, level, isFuture });
    }

    weeks.push(column);
  }

  return weeks;
}

// Etiqueta accesible de un día.
function getDayLabel(cell) {
  const label = formatDisplayDate(cell.date);

  if (cell.isFuture) {
    return `${label} (día futuro)`;
  }

  if (cell.minutes === 0) {
    return `${label} (sin estudio)`;
  }

  return `${label}, ${cell.minutes} minutos`;
}

// Doble entorno: en el navegador quedan como globales; en Node se exportan para los tests.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
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
  };
}
