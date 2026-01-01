const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const errorBox = document.getElementById("errorBox");

const resultBox = document.getElementById("resultBox");
const weatherBox = document.getElementById("weatherBox");

const addBtn = document.getElementById("addBtn");
const starIcon = document.getElementById("starIcon");

const reloadFavBtn = document.getElementById("reloadFavBtn");
const favoritesList = document.getElementById("favoritesList");

// Email scheduling UI
const userForm = document.getElementById("userForm");
const emailInput = document.getElementById("emailInput");
const cityEmailInput = document.getElementById("cityEmailInput");
const scheduleAtInput = document.getElementById("scheduleAt");
const userMsg = document.getElementById("userMsg");
const testEmailBtn = document.getElementById("testEmailBtn");

// Map
const map = L.map("map").setView([43.2389, 76.8897], 6);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
}).addTo(map);

let marker = null;
function setMarker(lat, lon, label) {
    if (marker) marker.remove();
    marker = L.marker([lat, lon]).addTo(map).bindPopup(label).openPopup();
    map.setView([lat, lon], 10);
}

//State
let favoritesSet = new Set(); // lowercase city names
let lastWeather = null;

//Helpers
function showError(msg) {
    errorBox.textContent = msg || "";
}

function showResult(shouldShow) {
    if (shouldShow) resultBox.classList.remove("hidden");
    else resultBox.classList.add("hidden");
}

function iconUrl(code) {
    return `https://openweathermap.org/img/wn/${code}@2x.png`;
}

function isFavorited(city) {
    return favoritesSet.has(String(city || "").toLowerCase());
}

function setStarUI(favorited) {
    starIcon.className = favorited ? "fa-solid fa-star" : "fa-regular fa-star";
    if (favorited) addBtn.classList.add("favorited");
    else addBtn.classList.remove("favorited");
}

function renderWeather(w) {
    lastWeather = w;

    const iconHtml = w.icon
        ? `<img class="bigIcon" src="${iconUrl(w.icon)}" alt="${w.description || ""}">`
        : "";

    weatherBox.innerHTML = `
    <div><strong>${w.city}</strong> (${w.country_code || "-"})</div>
    <div class="weatherRow">
      ${iconHtml}
      <div>
        <div>${w.description || "-"}</div>
        <div>Temp: ${w.temperature}°C (feels like ${w.feels_like}°C)</div>
        <div>Humidity: ${w.humidity}% | Pressure: ${w.pressure}</div>
        <div>Wind: ${w.wind_speed} m/s | Rain(3h): ${w.rain_last_3h}</div>
        <div>Coords: ${w.latitude}, ${w.longitude}</div>
      </div>
    </div>
  `;

    setStarUI(isFavorited(w.city));
}

function renderFavorites(items) {
    favoritesList.innerHTML = "";

    if (!items || items.length === 0) {
        favoritesList.innerHTML = "<li>No favorites yet</li>";
        return;
    }

    for (const w of items) {
        const li = document.createElement("li");
        li.className = "favItem";

        const left = document.createElement("div");
        left.className = "favLeft";

        const icon = document.createElement("img");
        icon.className = "favIcon";
        icon.src = w.icon ? iconUrl(w.icon) : "";
        icon.alt = w.description || "";

        const text = document.createElement("div");
        text.className = "favText";
        text.textContent = `${w.city} (${Math.round(w.temperature)}°C)`;

        left.appendChild(icon);
        left.appendChild(text);

        // click favorite -> load + move map + fill city for scheduling
        left.addEventListener("click", async () => {
            try {
                showError("");
                const one = await apiGetOneFavorite(w.city);
                renderWeather(one);
                showResult(true);
                setMarker(one.latitude, one.longitude, one.city);

                cityEmailInput.value = one.city;
            } catch (err) {
                showError(err.message);
            }
        });

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "iconBtn deleteBtn";
        delBtn.title = "Delete from favorites";
        delBtn.innerHTML = `<i class="fa-solid fa-trash"></i>`;

        delBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            showError("");
            try {
                await apiDeleteFavorite(w.city);
                await refreshFavorites();
            } catch (err) {
                showError(err.message);
            }
        });

        li.appendChild(left);
        li.appendChild(delBtn);
        favoritesList.appendChild(li);
    }
}

// ---- datetime-local min = now (block past selection) ----
function toLocalDatetimeValue(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return (
        date.getFullYear() +
        "-" + pad(date.getMonth() + 1) +
        "-" + pad(date.getDate()) +
        "T" + pad(date.getHours()) +
        ":" + pad(date.getMinutes())
    );
}

function setScheduleMinNow() {
    if (!scheduleAtInput) return;
    const now = new Date();
    scheduleAtInput.min = toLocalDatetimeValue(now);
}

// ---------------- API helpers ----------------
async function readJsonOrEmpty(res) {
    try {
        return await res.json();
    } catch {
        return {};
    }
}

async function apiSearchCity(city) {
    const res = await fetch(`/api/weather/search?city=${encodeURIComponent(city)}`);
    const data = await readJsonOrEmpty(res);
    if (!res.ok) throw new Error(data.error || "City search failed");
    return data;
}

async function apiAddFavorite(city) {
    const res = await fetch("/api/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city }),
    });
    const data = await readJsonOrEmpty(res);
    if (!res.ok) throw new Error(data.error || "Add to favorites failed");
    return data;
}

async function apiGetFavoritesWeather() {
    const res = await fetch("/api/weather");
    const data = await readJsonOrEmpty(res);
    if (!res.ok) throw new Error(data.error || "Load favorites failed");
    return data;
}

async function apiGetOneFavorite(city) {
    const res = await fetch(`/api/weather/${encodeURIComponent(city)}`);
    const data = await readJsonOrEmpty(res);
    if (!res.ok) throw new Error(data.error || "Load favorite failed");
    return data;
}

async function apiDeleteFavorite(city) {
    const res = await fetch(`/api/weather/${encodeURIComponent(city)}`, { method: "DELETE" });
    const data = await readJsonOrEmpty(res);
    if (!res.ok) throw new Error(data.error || "Delete failed");
    return data;
}

// Save user + optional schedule_at ("YYYY-MM-DDTHH:MM")
async function apiSaveUser(email, city, scheduleAtRaw) {
    const body = { email, city };
    if (scheduleAtRaw) body.schedule_at = scheduleAtRaw;

    const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const data = await readJsonOrEmpty(res);
    if (!res.ok) throw new Error(data.error || "Failed to save user");
    return data;
}

// Send immediate email (backend uses saved user city)
async function apiSendTestEmail(email) {
    const res = await fetch("/api/users/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    const data = await readJsonOrEmpty(res);
    if (!res.ok) throw new Error(data.error || "Failed to send test email");
    return data;
}

async function refreshFavorites() {
    const items = await apiGetFavoritesWeather();
    favoritesSet = new Set(items.map((w) => String(w.city || "").toLowerCase()));
    renderFavorites(items);
    if (lastWeather?.city) setStarUI(isFavorited(lastWeather.city));
}

// ---------------- Event listeners ----------------

// Search
searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");
    showResult(false);

    const city = searchInput.value.trim();
    if (!city) return showError("Type a city name");

    try {
        const w = await apiSearchCity(city);
        renderWeather(w);
        showResult(true);

        if (typeof w.latitude === "number" && typeof w.longitude === "number") {
            setMarker(w.latitude, w.longitude, w.city);
        }

        // helpful autofill for scheduling
        cityEmailInput.value = w.city;
    } catch (err) {
        showError(err.message);
    }
});

addBtn.addEventListener("click", async () => {
    showError("");
    if (!lastWeather?.city) return;

    const city = lastWeather.city;
    try {
        if (isFavorited(city)) {
            await apiDeleteFavorite(city);
        } else {
            await apiAddFavorite(city);
        }
        await refreshFavorites();
    } catch (err) {
        showError(err.message);
    }
});

reloadFavBtn.addEventListener("click", async () => {
    showError("");
    try {
        await refreshFavorites();
    } catch (err) {
        showError(err.message);
    }
});

// Save schedule
userForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");
    userMsg.textContent = "";

    const email = emailInput.value.trim().toLowerCase();
    const city = cityEmailInput.value.trim();
    const scheduleAtRaw = (scheduleAtInput?.value || "").trim(); // "YYYY-MM-DDTHH:MM" or ""

    if (!email || !city) {
        userMsg.textContent = "Please enter both email and city.";
        return;
    }

    try {
        // Always save user (with schedule_at if present)
        const saved = await apiSaveUser(email, city, scheduleAtRaw);

        // If schedule empty -> send immediately
        if (!scheduleAtRaw) {
            await apiSendTestEmail(email);
            userMsg.textContent = "Saved - and sent immediately (check inbox/spam)";
            return;
        }

        // If scheduled, show saved time (nice)
        const nice = new Date(scheduleAtRaw).toLocaleString();
        userMsg.textContent = `Saved - Scheduled at: ${scheduleAtRaw} (${nice})`;
    } catch (err) {
        userMsg.textContent = err.message;
    }
});

// Manual test send
testEmailBtn.addEventListener("click", async () => {
    showError("");
    userMsg.textContent = "";

    const email = emailInput.value.trim().toLowerCase();
    if (!email) {
        userMsg.textContent = "Enter email first.";
        return;
    }

    try {
        await apiSendTestEmail(email);
        userMsg.textContent = "Test email sent (check inbox/spam)";
    } catch (err) {
        userMsg.textContent = err.message;
    }
});

//Init
setScheduleMinNow();
setInterval(setScheduleMinNow, 30_000);

refreshFavorites().catch((err) => showError(err.message));