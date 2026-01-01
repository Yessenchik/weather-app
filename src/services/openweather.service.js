const axios = require("axios");

const CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

function requireApiKey() {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
        const err = new Error("Missing OPENWEATHER_API_KEY in .env");
        err.status = 500;
        throw err;
    }
    return apiKey;
}

function toWeatherDTO(apiData) {
    // rain can be missing -> treat as 0
    const rainLast3h =
        apiData.rain && typeof apiData.rain["3h"] === "number" ? apiData.rain["3h"] : 0;

    return {
        city: apiData.name,
        country_code: apiData.sys?.country,
        temperature: apiData.main?.temp,
        feels_like: apiData.main?.feels_like,
        humidity: apiData.main?.humidity,
        pressure: apiData.main?.pressure,
        description: apiData.weather?.[0]?.description,
        icon: apiData.weather?.[0]?.icon,
        latitude: apiData.coord?.lat,
        longitude: apiData.coord?.lon,
        wind_speed: apiData.wind?.speed,
        rain_last_3h: rainLast3h,
    };
}

function toForecastDTO(apiData, cityInput) {
    // apiData.list is 5-day forecast in 3-hour steps
    const list = Array.isArray(apiData.list) ? apiData.list : [];

    // Choose "tomorrow" date in server local time
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const d = String(tomorrow.getDate()).padStart(2, "0");
    const targetDate = `${y}-${m}-${d}`;

    // Find first forecast item for tomorrow
    const candidates = list.filter((x) => String(x.dt_txt || "").startsWith(targetDate));
    const chosen = candidates[0] || list[0];

    if (!chosen) {
        const err = new Error("Forecast data not available");
        err.status = 502;
        throw err;
    }

    const rainLast3h =
        chosen.rain && typeof chosen.rain["3h"] === "number" ? chosen.rain["3h"] : 0;

    return {
        city: cityInput,
        api_city_name: apiData.city?.name, // for debugging (optional)
        country_code: apiData.city?.country,

        datetime: chosen.dt_txt,

        temperature: chosen.main?.temp,
        feels_like: chosen.main?.feels_like,
        humidity: chosen.main?.humidity,
        pressure: chosen.main?.pressure,

        description: chosen.weather?.[0]?.description,
        icon: chosen.weather?.[0]?.icon,

        wind_speed: chosen.wind?.speed,
        rain_last_3h: rainLast3h,
    };
}

async function getCurrentWeatherByCity(city) {
    const apiKey = requireApiKey();

    try {
        const response = await axios.get(CURRENT_URL, {
            params: {
                q: city,
                appid: apiKey,
                units: "metric",
            },
        });

        return toWeatherDTO(response.data);
    } catch (err) {
        const status = err.response?.status;
        const message = err.response?.data?.message;

        const e = new Error(message || "OpenWeather current weather request failed");
        e.status = status || 500;
        throw e;
    }
}

async function getTomorrowForecastByCity(city) {
    const apiKey = requireApiKey();

    try {
        const response = await axios.get(FORECAST_URL, {
            params: {
                q: city,
                appid: apiKey,
                units: "metric",
            },
        });

        return toForecastDTO(response.data, city);
    } catch (err) {
        const status = err.response?.status;
        const message = err.response?.data?.message;

        const e = new Error(message || "OpenWeather forecast request failed");
        e.status = status || 500;
        throw e;
    }
}

module.exports = {
    getCurrentWeatherByCity,
    getTomorrowForecastByCity,
};