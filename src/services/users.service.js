const { readJSON, writeJSON } = require("../storage/fileStore");

const USERS_FILE = "users.json";

function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

function normalizeCity(city) {
    return String(city || "").trim();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// scheduleAtRaw comes from datetime-local like "2026-01-02T02:26"
function parseScheduleAtMs(scheduleAtRaw) {
    if (!scheduleAtRaw) return null;

    // Important: treat it as LOCAL datetime (datetime-local is local)
    // Convert "YYYY-MM-DDTHH:MM" -> Date in local timezone reliably:
    const [datePart, timePart] = scheduleAtRaw.split("T");
    if (!datePart || !timePart) {
        const err = new Error("schedule_at must be in format YYYY-MM-DDTHH:MM");
        err.status = 400;
        throw err;
    }

    const [y, m, d] = datePart.split("-").map(Number);
    const [hh, mm] = timePart.split(":").map(Number);

    const dt = new Date(y, (m - 1), d, hh, mm, 0, 0); // LOCAL time
    const ms = dt.getTime();

    if (Number.isNaN(ms)) {
        const err = new Error("schedule_at must be a valid datetime");
        err.status = 400;
        throw err;
    }

    const now = Date.now();
    if (ms <= now) {
        const err = new Error("schedule_at must be in the future");
        err.status = 400;
        throw err;
    }

    return ms;
}

async function getUsers() {
    return readJSON(USERS_FILE, []);
}

async function saveUsers(users) {
    await writeJSON(USERS_FILE, users);
}

async function upsertUser(email, city, scheduleAtRaw) {
    const cleanEmail = normalizeEmail(email);
    const cleanCity = normalizeCity(city);

    if (!isValidEmail(cleanEmail)) {
        const err = new Error("Invalid email format");
        err.status = 400;
        throw err;
    }
    if (!cleanCity) {
        const err = new Error("City is required");
        err.status = 400;
        throw err;
    }

    const schedule_at_ms = parseScheduleAtMs(scheduleAtRaw);

    const users = await getUsers();
    const idx = users.findIndex((u) => u.email === cleanEmail);

    if (idx >= 0) {
        users[idx].city = cleanCity;
        users[idx].schedule_at_ms = schedule_at_ms; // overwrite schedule
    } else {
        users.push({ email: cleanEmail, city: cleanCity, schedule_at_ms });
    }

    await saveUsers(users);

    return { email: cleanEmail, city: cleanCity, schedule_at_ms };
}

module.exports = {
    getUsers,
    saveUsers,
    upsertUser,
};