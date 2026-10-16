// UI y datos. La lógica pura (fechas, sesiones, mapa) vive en logic.js,
// que se carga antes que este archivo en index.html.
const STORAGE_KEY = "diario-de-estudio-sesiones";

const form = document.getElementById("session-form");
const dateInput = document.getElementById("date");
const themeInput = document.getElementById("theme");
const minutesInput = document.getElementById("minutes");
const streakCount = document.getElementById("streak-count");
const streakUnit = document.getElementById("streak-unit");
const bestStreakCount = document.getElementById("best-streak-count");
const bestStreakUnit = document.getElementById("best-streak-unit");
const weekMinutes = document.getElementById("week-minutes");
const monthDaysCount = document.getElementById("month-days");
const monthDaysUnit = document.getElementById("month-days-unit");
const sessionsList = document.getElementById("sessions-list");
const heatmapPanel = document.getElementById("heatmap-panel");
const heatmapGrid = document.getElementById("heatmap-grid");
const heatmapTooltip = document.getElementById("heatmap-tooltip");

const sessions = loadSessions();

initialize();

function initialize() {
  dateInput.lang = "es-AR";
  dateInput.max = formatInputDate(new Date());
  dateInput.value = formatInputDate(new Date());
  form.addEventListener("submit", handleSubmit);
  setupHeatmapEvents();
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
  renderWeekMinutes();
  renderMonthDays();
  renderHeatmap();
  renderSessions();
}

function renderWeekMinutes() {
  const totalMinutes = calculateWeekMinutes(sessions);
  weekMinutes.textContent = formatWeekMinutes(totalMinutes);
}

function renderMonthDays() {
  const monthDays = calculateMonthDays(sessions);
  monthDaysCount.textContent = String(monthDays);
  monthDaysUnit.textContent = monthDays === 1 ? "día" : "días";
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

function renderHeatmap() {
  const today = formatInputDate(new Date());
  const weeks = buildHeatmap(sessions, today);

  heatmapGrid.innerHTML = weeks
    .map((week) => week.map(renderHeatmapCell).join(""))
    .join("");
}

function renderHeatmapCell(cell) {
  const label = escapeHtml(getDayLabel(cell));
  const stateClass = cell.isFuture ? "is-future" : `level-${cell.level}`;
  return `<button type="button" class="heatmap-cell ${stateClass}" data-day-label="${label}" aria-label="${label}"></button>`;
}

function setupHeatmapEvents() {
  heatmapGrid.addEventListener("mouseover", handleHeatmapPointer);
  heatmapGrid.addEventListener("mouseout", hideHeatmapTooltip);
  heatmapGrid.addEventListener("focusin", handleHeatmapPointer);
  heatmapGrid.addEventListener("focusout", hideHeatmapTooltip);
  heatmapGrid.addEventListener("click", handleHeatmapPointer);
  document.addEventListener("click", (event) => {
    if (!findHeatmapCell(event.target)) {
      hideHeatmapTooltip();
    }
  });
}

function findHeatmapCell(target) {
  if (target && target.classList && target.classList.contains("heatmap-cell")) {
    return target;
  }

  return null;
}

function handleHeatmapPointer(event) {
  const cell = findHeatmapCell(event.target);

  if (cell) {
    showHeatmapTooltip(cell);
  }
}

function showHeatmapTooltip(cell) {
  heatmapTooltip.textContent = cell.dataset.dayLabel;
  heatmapTooltip.hidden = false;

  const panelRect = heatmapPanel.getBoundingClientRect();
  const cellRect = cell.getBoundingClientRect();
  heatmapTooltip.style.left = `${cellRect.left - panelRect.left + cellRect.width / 2}px`;
  heatmapTooltip.style.top = `${cellRect.top - panelRect.top}px`;
}

function hideHeatmapTooltip() {
  heatmapTooltip.hidden = true;
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

function calculateWeekMinutes(sessionList) {
  const today = formatInputDate(new Date());
  const { start, end } = getWeekRange(new Date());

  return sessionList.reduce((total, session) => {
    if (!isValidLocalDate(session.date) || session.date > today) {
      return total;
    }

    if (session.date >= start && session.date <= end) {
      return total + Number(session.minutes);
    }

    return total;
  }, 0);
}

function getWeekRange(referenceDate) {
  const day = referenceDate.getDay();
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  const monday = addDays(referenceDate, offsetToMonday);
  const sunday = addDays(monday, 6);

  return {
    start: formatInputDate(monday),
    end: formatInputDate(sunday),
  };
}

function calculateMonthDays(sessionList) {
  const today = formatInputDate(new Date());
  const { start, end } = getMonthRange(new Date());
  const sessionDays = getSessionDays(sessionList, today);

  let monthDays = 0;
  sessionDays.forEach((date) => {
    if (date >= start && date <= end) {
      monthDays += 1;
    }
  });

  return monthDays;
}

function getMonthRange(referenceDate) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  return {
    start: formatInputDate(new Date(year, month, 1)),
    end: formatInputDate(new Date(year, month + 1, 0)),
  };
}

function formatWeekMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
}

function getSessionDays(sessionList, today) {
  return new Set(
    sessionList
      .map((session) => session.date)
      .filter((date) => isValidLocalDate(date) && date <= today)
  );
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
          isValidLocalDate(session.date) &&
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
