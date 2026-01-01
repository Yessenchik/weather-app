const {
    getCurrentWeatherByCity,
} = require("../services/openweather.service");

const {
    getFavorites,
    addFavorite,
    removeFavorite,
} = require("../services/favorites.service");

async function searchCity(req, res) {
    try {
        const city = String(req.query.city || "").trim();
        if (!city) return res.status(400).json({ error: "Query must include ?city=" });

        const weather = await getCurrentWeatherByCity(city);
        return res.json(weather);
    } catch (err) {
        return res.status(err.status || 500).json({ error: err.message });
    }
}

async function listFavorites(req, res) {
    try {
        const cities = await getFavorites(); // returns ["Almaty", "Taraz"]
        const results = [];

        for (const c of cities) {
            try {
                results.push(await getCurrentWeatherByCity(c));
            } catch {
                // ignore one broken city but keep others
            }
        }

        return res.json(results);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function addFavoriteCity(req, res) {
    try {
        const city = String(req.body?.city || "").trim();
        if (!city) return res.status(400).json({ error: "Body must include { city }" });

        // validate by calling OpenWeather first
        await getCurrentWeatherByCity(city);

        await addFavorite(city);
        return res.status(201).json({ ok: true, city });
    } catch (err) {
        return res.status(err.status || 500).json({ error: err.message });
    }
}

async function getFavoriteCity(req, res) {
    try {
        const city = String(req.params.city || "").trim();
        if (!city) return res.status(400).json({ error: "City param required" });

        const weather = await getCurrentWeatherByCity(city);
        return res.json(weather);
    } catch (err) {
        return res.status(err.status || 500).json({ error: err.message });
    }
}

async function deleteFavoriteCity(req, res) {
    try {
        const city = String(req.params.city || "").trim();
        if (!city) return res.status(400).json({ error: "City param required" });

        await removeFavorite(city);
        return res.json({ ok: true, city });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = {
    searchCity,
    listFavorites,
    addFavoriteCity,
    getFavoriteCity,
    deleteFavoriteCity,
};