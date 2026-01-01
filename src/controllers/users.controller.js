const { upsertUser, getUsers } = require("../services/users.service");
const { getCurrentWeatherByCity } = require("../services/openweather.service");
const { sendEmail } = require("../services/email.service");

async function createOrUpdateUser(req, res) {
    try {
        const { email, city, schedule_at } = req.body || {};

        if (!email || !city) {
            return res.status(400).json({ error: "Body must include { email, city }" });
        }

        const saved = await upsertUser(email, city, schedule_at);
        return res.status(201).json({ ok: true, user: saved });
    } catch (err) {
        return res.status(err.status || 500).json({ error: err.message });
    }
}

async function listUsers(req, res) {
    try {
        const users = await getUsers();
        return res.json(users);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function sendTestEmail(req, res) {
    try {
        const { email } = req.body || {};
        if (!email) return res.status(400).json({ error: "Body must include { email }" });

        const users = await getUsers();
        const cleanEmail = String(email).trim().toLowerCase();
        const user = users.find((u) => u.email === cleanEmail);

        if (!user) return res.status(404).json({ error: "User not found" });

        const weather = await getCurrentWeatherByCity(user.city);

        const subject = `Weather update for ${weather.city}`;
        const text =
            `City: ${weather.city}\n` +
            `Temperature: ${weather.temperature}°C\n` +
            `Feels like: ${weather.feels_like}°C\n` +
            `Description: ${weather.description}\n` +
            `Humidity: ${weather.humidity}%\n` +
            `Pressure: ${weather.pressure} hPa\n` +
            `Wind speed: ${weather.wind_speed} m/s\n` +
            `Rain (last 3h): ${weather.rain_last_3h}\n`;

        await sendEmail(user.email, subject, text);

        return res.json({ ok: true, message: "Test email sent", sentTo: user.email });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = {
    createOrUpdateUser,
    listUsers,
    sendTestEmail,
};