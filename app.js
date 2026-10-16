const STORAGE_KEY = "diario-de-estudio-sesiones";
const DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const form = document.getElementById("session-form");
const dateInput = document.getElementById("date");
const themeInput = document.getElementById("theme");
const minutesInput = document.getElementById("minutes");
const streakCount = document.getElementById("streak-count");
const streakUnit = document.getElementById("streak-unit");
const bestStreakCount = document.getElementById("best-streak-count");
const bestStreakUnit = document.getElementById("best-streak-unit");
const sessionsList = document.getElementById("sessions-list");

const sessions = loadSessions();

initialize();

function initialize() {
  dateInput.lang = "es-AR";
  dateInput.max = formatInputDate(new Date());
  dateInput.value = formatInputDate(new Date());
  form.addEventListener("submit", handleSubmit);
  render();
}

function handleSubmit(event) {
  event.preventDefault();

  const date = dateInput.value.trim();
  const theme = themeInput.value.trim();
  const minutes = Number(minutesInput.value);

  if (!date || !theme || !Number.isInteger(minutes) || minutes <= 0) {
    form.reportValidity();
    return;
  }

  const newSession = {
    id: createId(),
    date,
    theme,
    minutes,
  };

  sessions.push(newSession);
  sessions.sort((first, second) => parseLocalDate(second.date).getTime() - parseLocalDate(first.date).getTime());

  saveSessions();
  render();

  form.reset();
  dateInput.value = formatInputDate(new Date());
  themeInput.focus();
}

function render() {
  renderStreak();
  renderSessions();
}

function renderStreak() {
  const currentStreak = calculateCurrentStreak(sessions);
  const bestStreak = calculateBestStreak(sessions);

  streakCount.textContent = String(currentStreak);
  streakUnit.textContent = currentStreak === 1 ? "día" : "días";
  bestStreakCount.textContent = String(bestStreak);
  bestStreakUnit.textContent = bestStreak === 1 ? "día" : "días";
}

function renderSessions() {
  if (sessions.length === 0) {
    sessionsList.innerHTML = '<li class="empty-state">Todavía no hay sesiones registradas.</li>';
    return;
  }

  sessionsList.innerHTML = sessions
    .map(
      (session) => `
        <li class="session-item">
          <div class="session-top">
            <strong>${escapeHtml(session.theme)}</strong>
            <span>${session.minutes} min</span>
          </div>
          <time>${formatDisplayDate(session.date)}</time>
        </li>
      `
    )
    .join("");
}

function calculateCurrentStreak(sessionList) {
  const today = formatInputDate(new Date());
  const sessionDays = getSessionDays(sessionList, today);
  const yesterday = formatInputDate(addDays(new Date(), -1));

  const anchorDate = sessionDays.has(today) ? today : sessionDays.has(yesterday) ? yesterday : null;

  if (!anchorDate) {
    return 0;
  }

  let streak = 0;
  let currentDate = parseLocalDate(anchorDate);

  while (sessionDays.has(formatInputDate(currentDate))) {
    streak += 1;
    currentDate = addDays(currentDate, -1);
  }

  return streak;
}

function calculateBestStreak(sessionList) {
  const today = formatInputDate(new Date());
  const sessionDays = Array.from(getSessionDays(sessionList, today)).sort();
  let bestStreak = 0;
  let currentStreak = 0;
  let previousDate = null;

  sessionDays.forEach((date) => {
    if (previousDate && formatInputDate(addDays(parseLocalDate(previousDate), 1)) === date) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    bestStreak = Math.max(bestStreak, currentStreak);
    previousDate = date;
  });

  return bestStreak;
}

function getSessionDays(sessionList, today) {
  return new Set(
    sessionList
      .map((session) => session.date)
      .filter((date) => isValidLocalDate(date) && date <= today)
  );
}

function isValidLocalDate(dateString) {
  if (typeof dateString !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }

  return formatInputDate(parseLocalDate(dateString)) === dateString;
}

function loadSessions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((session) => {
        return (
          session &&
          typeof session.date === "string" &&
          typeof session.theme === "string" &&
          Number.isFinite(Number(session.minutes)) &&
          Number(session.minutes) > 0
        );
      })
      .sort((first, second) => parseLocalDate(second.date).getTime() - parseLocalDate(first.date).getTime());
  } catch (error) {
    return [];
  }
}

function saveSessions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function formatInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date, amount) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function formatDisplayDate(dateString) {
  const date = parseLocalDate(dateString);
  return DATE_FORMATTER.formatToParts(date)
    .filter((part) => part.type === "day" || part.type === "month" || part.type === "year")
    .map((part) => part.value)
    .join("-");
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
