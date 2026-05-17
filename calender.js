/* ===== Constants ===== */

// Weekday labels for the calendar header
const WEEK = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
let SYMPTOMS = [];
let MOODS = [];

/* ===== State ===== */

// AJAX + JSON Integration

// Load symptoms from JSON file
fetch("./data/symptoms.json")
  .then(response => response.json())
  .then(data => {

    SYMPTOMS = data.map(item => item.name);

    renderSymptoms();
  });

// Load moods from JSON file
fetch("./data/moods.json")
  .then(response => response.json())
  .then(data => {

    MOODS = data;

    renderMoods();
  });

const today = new Date();
let lastPeriodDate = new Date(2026, 3, 7); // April 7, 2026
let cycleLength = 28;
let periodDuration = 5;
let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = new Date(today);

/* ===== Helpers ===== */

// Pad a number to 2 digits, e.g. 3 -> "03"  
function pad2(n) { return String(n).padStart(2, "0"); }

// Convert a Date object to a string in YYYY-MM-DD format for input value 
function toInputValue(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// Parse a date string in YYYY-MM-DD format to a Date object 
function parseLocalDate(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

// Check if two dates are on the same calendar day
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

// Get the difference in days between two dates (a - b)
function diffDays(a, b) {
  const ms = 86400000;
  const ad = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bd = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ad - bd) / ms);
}

// Generate a storage key for a given date, e.g. "hercycle:log:2026-4-7"
function storageKey(date) {
  return `hercycle:log:${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/* ===== Header ===== */

// Elements
const lastPeriodInput = document.getElementById("lastPeriod");
const cycleSel = document.getElementById("cycleLength");
const durationSel = document.getElementById("periodDuration");
const nextPeriodEl = document.getElementById("nextPeriodDate");

// Fill a select element with options, e.g. fillSelect(cycleSel, [21,22,...], "days", 28)
function fillSelect(sel, options, suffix, value) {
  // Clear existing options
  sel.innerHTML = "";
  // Add new options
  for (const o of options) {
    // Create option element with value and text, mark as selected if it matches the current value
    const opt = document.createElement("option");
    opt.value = o;
    opt.textContent = `${o} ${suffix}`;
    if (o === value) opt.selected = true;
    sel.appendChild(opt);
  }
}

// Update the displayed next period date based on the last period date and cycle length
function updateNextPeriod() {
  const next = new Date(lastPeriodDate);
  next.setDate(next.getDate() + cycleLength);
  nextPeriodEl.textContent = next.toLocaleDateString("en-US", {
    weekday: "short", month: "long", day: "numeric", year: "numeric",
  });
}

// Initialize header inputs and event listeners
function initHeader() {
  lastPeriodInput.value = toInputValue(lastPeriodDate);
  // Fill cycle length select with options from 21 to 41 days
  fillSelect(cycleSel,
    Array.from({ length: 21 }, (_, i) => 21 + i), "days", cycleLength);
  // Fill period duration select with options from 2 to 9 days
  fillSelect(durationSel,
    Array.from({ length: 8 }, (_, i) => 2 + i), "days", periodDuration);
  
  // Event listeners to update state and re-render calendar when inputs change
  lastPeriodInput.addEventListener("change", (e) => {
    lastPeriodDate = parseLocalDate(e.target.value);
    updateNextPeriod();
    renderCalendar();
  });

  // Event listener for cycle length select to update the cycle length and re-render the calendar
  cycleSel.addEventListener("change", (e) => {
    cycleLength = Number(e.target.value);
    updateNextPeriod();
    renderCalendar();
  });

  // Event listener for period duration select to update the period duration and re-render the calendar
  durationSel.addEventListener("change", (e) => {
    periodDuration = Number(e.target.value);
    renderCalendar();
  });

  // Event listener for apply button to update the next period date and re-render the calendar based on current inputs
  document.getElementById("applyBtn").addEventListener("click", () => {
    updateNextPeriod();
    renderCalendar();
  });

  // Initial update of the next period date display
  updateNextPeriod();
}

/* ===== Calendar ===== */
const monthLabel = document.getElementById("monthLabel");
const daysEl = document.getElementById("days");

// Compute sets of date keys for period days and next period days to simplify rendering
function computePeriodSets() {
  const period = new Set();
  const next = new Set();
  //
  for (let k = -6; k <= 6; k++) {
    const start = new Date(lastPeriodDate);
    start.setDate(start.getDate() + k * cycleLength);
    for (let d = 0; d < periodDuration; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + d);
      const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
      if (k <= 0 && diffDays(day, today) <= 0) period.add(key);
      else next.add(key);
    }
  }
  return { period, next };
}

// Render the calendar for the current view month, marking period days, next period days, and today
function renderCalendar() {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  monthLabel.textContent =
    `${viewDate.toLocaleString("en-US", { month: "long" }).toUpperCase()} ${year}`;

  const { period, next } = computePeriodSets();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

  daysEl.innerHTML = "";
  for (let i = 0; i < firstWeekday; i++) {
    const empty = document.createElement("div");
    daysEl.appendChild(empty);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement("div");
    cell.className = "day-cell";
    const inner = document.createElement("div");
    inner.className = "day";
    inner.textContent = d;
    const key = `${year}-${month}-${d}`;
    const date = new Date(year, month, d);
    if (period.has(key)) inner.classList.add("is-period");
    else if (next.has(key)) inner.classList.add("is-next");
    if (sameDay(date, today)) inner.classList.add("is-today");
    cell.appendChild(inner);
    daysEl.appendChild(cell);
  }
}

// Event listeners for month navigation buttons and today button
document.getElementById("prevMonth").addEventListener("click", () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  renderCalendar();
});

// Event listener for next month button
document.getElementById("nextMonth").addEventListener("click", () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  renderCalendar();
});

// Event listener for today button to jump back to current month
document.getElementById("todayBtn").addEventListener("click", () => {
  viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
  renderCalendar();
});

/* ===== Daily Log Panel ===== */
const symptomsEl = document.getElementById("symptoms");
const moodsEl = document.getElementById("moods");
const notesEl = document.getElementById("notes");
const dateLabelEl = document.getElementById("dateLabel");

let currentSymptoms = [];
let currentMood = null;

// Render the list of symptoms with checkboxes, reflecting the current selected symptoms
function renderSymptoms() {
  symptomsEl.innerHTML = "";
  // For each symptom, create a checkbox and label
  for (const s of SYMPTOMS) {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = currentSymptoms.includes(s);
    // Event listener for checkbox change to update the current symptoms list
    cb.addEventListener("change", () => {
      if (cb.checked) currentSymptoms.push(s);
      else currentSymptoms = currentSymptoms.filter((x) => x !== s);
    });
    label.appendChild(cb);
    label.appendChild(document.createTextNode(s));
    symptomsEl.appendChild(label);
  }
}

// Render the list of moods as buttons with emojis, allowing selection of one mood at a time
function renderMoods() {
  moodsEl.innerHTML = "";
  // For each mood, create a button with an emoji and label, marking it as active if it's the current mood
  for (const m of MOODS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mood-btn" + (currentMood === m.key ? " active" : "");
    let emojiHtml;
    if (m.key === "happy") {
      emojiHtml = `<img src="./images/happy(1).jpg" alt="happy" class="emoji">`;
    } else if (m.key === "sad") {
      emojiHtml = `<img src="./images/sad.jpg" alt="sad" class="emoji">`;
    } else if (m.key === "angry") {
      emojiHtml = `<img src="./images/angry.jpg" alt="angry" class="emoji angry-emoji">`;
    } else if (m.key === "tired") {
      emojiHtml = `<img src="./images/tired.jpg" alt="tired" class="emoji tired-emoji">`;
    } else {
      emojiHtml = `<span class="emoji">${m.emoji}</span>`;
    }
    btn.innerHTML = `${emojiHtml}${m.key}`;
    // Event listener for mood button click to toggle the current mood selection
    btn.addEventListener("click", () => {
      currentMood = currentMood === m.key ? null : m.key;
      renderMoods();
    });
    // Append the mood button to the moods container
    moodsEl.appendChild(btn);
  }
}

// Load the entry for the selected date from localStorage, or initialize empty if none exists. Update the date label and render symptoms and moods.
function loadEntry() {
  //
  const raw = localStorage.getItem(storageKey(selectedDate));
  if (raw) {
    try {
      // Parse the stored JSON data for the selected date, extracting symptoms, mood, and notes. If parsing fails, initialize empty values.
      const data = JSON.parse(raw);
      currentSymptoms = data.symptoms || [];
      currentMood = data.mood || null;
      notesEl.value = data.notes || "";
    } catch {
      currentSymptoms = []; currentMood = null; notesEl.value = "";
    }
  } else {
    currentSymptoms = []; currentMood = null; notesEl.value = "";
  }

  //
  const isToday = sameDay(selectedDate, today);
  //
  const dateLabel = selectedDate.toLocaleDateString("en-US", {
    month: "long", day: "2-digit", year: "numeric",
  });
  dateLabelEl.textContent = `${isToday ? "Today" : "Date"} : ${dateLabel}`;
  renderSymptoms();
  renderMoods();
}

// Event listener for date button to allow user to pick a date for the log entry. 
document.getElementById("dateBtn").addEventListener("click", () => {
  const value = prompt(
    "Pick a date (YYYY-MM-DD):",
    toInputValue(selectedDate),
  );
  if (!value) return;
  const d = parseLocalDate(value);
  if (isNaN(d.getTime()) || d > today) {
    showToast("Please pick today or an earlier date.");
    return;
  }
  selectedDate = d;
  loadEntry();
});

// Event listener for save button to save the current symptoms, mood, and notes for the selected date in localStorage. 
document.getElementById("saveBtn").addEventListener("click", () => {
  // Create a data object containing the current symptoms, mood, and notes (truncated to 1000 characters) for the selected date. 
  const data = {
    symptoms: currentSymptoms,
    mood: currentMood,
    notes: notesEl.value.trim().slice(0, 1000),
  };
  // Save the data object as a JSON string in localStorage using a key generated from the selected date. 
  localStorage.setItem(storageKey(selectedDate), JSON.stringify(data));
  const dateLabel = selectedDate.toLocaleDateString("en-US", {
    month: "long", day: "2-digit", year: "numeric",
  });
  // Show a toast notification confirming that the entry for the selected date has been saved.
  showToast(`Saved entry for ${dateLabel}`);
});

/* ===== Bottom Nav ===== */

document.querySelectorAll('[data-nav]').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.nav));
});

function navigate(target){
  document.querySelectorAll('.bottom-nav .nav-item').forEach(n =>
    n.classList.toggle('active', n.dataset.nav === target));
  if (target === 'community'){
    screens.home.classList.add('hidden');
    screens.community.classList.remove('hidden');
  } else {
    screens.community.classList.add('hidden');
    screens.home.classList.remove('hidden');
  }
  /* First, it updates the active style on the nav buttons
     Then it checks: if going to community, HIDE home
     screen and SHOW community screen
     Otherwise, do the opposite*/
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


/* ===== Toast ===== */

let toastTimer;
function showToast(message) {
  // Get the toast element 
  const toast = document.getElementById("toast");
  // Set the text content of the toast element to the provided message, making it visible to the user.
  toast.textContent = message;
  // Add the "show" class to the toast element to trigger the CSS animation that makes it appear on the screen.
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

/* ===== Boot ===== */
// Initialize the header elements.
initHeader();
// Initial render of the calendar and load of the daily log entry for the selected date (defaulting to today).
renderCalendar();
// Load the daily log entry for the selected date (defaulting to today) to populate the symptoms, mood, and notes in the daily log panel.
loadEntry();
