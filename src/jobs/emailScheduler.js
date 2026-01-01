const cron = require("node-cron");
const { getUsers } = require("../services/users.service");
const { getCurrentWeatherByCity, getTomorrowForecastByCity } = require("../services/openweather.service");
const { sendEmail } = require("../services/email.service");
const { getRecommendation } = require("../services/recommendations.service");

async function sendCurrentWeatherEmails(label) {
    const users = await getUsers();

    for (const user of users) {
        try {
            const w = await getCurrentWeatherByCity(user.city);

            const subject = `${label} weather update: ${w.city}`;
            const text =
                `Hello!\n\n` +
                `Here is your ${label.toLowerCase()} weather update.\n\n` +
                `City: ${w.city} (${w.country_code || "-"})\n` +
                `Temp: ${w.temperature}°C (feels like ${w.feels_like}°C)\n` +
                `Description: ${w.description}\n` +
                `Humidity: ${w.humidity}%\n` +
                `Wind: ${w.wind_speed} m/s\n` +
                `Rain(3h): ${w.rain_last_3h}\n\n` +
                `Have a nice day!`;

            await sendEmail(user.email, subject, text);
        } catch (err) {
            console.error("Email send failed:", user.email, user.city, err.message);
        }
    }
}

async function sendTomorrowForecastEmails() {
    const users = await getUsers();

    for (const user of users) {
        try {
            const f = await getTomorrowForecastByCity(user.city);
            const rec = getRecommendation(f);

            const subject = `Tomorrow forecast: ${f.city}`;
            const text =
                `Hello!\n\n` +
                `Tomorrow forecast for ${f.city} (${f.country_code || "-"})\n` +
                `Time: ${f.datetime}\n` +
                `Temp: ${f.temperature}°C (feels like ${f.feels_like}°C)\n` +
                `Description: ${f.description}\n` +
                `Humidity: ${f.humidity}%\n` +
                `Wind: ${f.wind_speed} m/s\n` +
                `Rain(3h): ${f.rain_last_3h}\n\n` +
                `Recommendation: ${rec}\n\n` +
                `Good night!`;

            await sendEmail(user.email, subject, text);
        } catch (err) {
            console.error("Forecast email failed:", user.email, user.city, err.message);
        }
    }
}

function startScheduler() {
    // 09:00
    cron.schedule("0 9 * * *", () => {
        console.log("CRON: 09:00 morning weather");
        sendCurrentWeatherEmails("Morning");
    });

    // 13:00
    cron.schedule("0 13 * * *", () => {
        console.log("CRON: 13:00 afternoon weather");
        sendCurrentWeatherEmails("Afternoon");
    });

    // 20:00
    cron.schedule("0 20 * * *", () => {
        console.log("CRON: 20:00 evening weather");
        sendCurrentWeatherEmails("Evening");
    });

    // 22:00 forecast + recommendation
    cron.schedule("0 22 * * *", () => {
        console.log("CRON: 22:00 tomorrow forecast");
        sendTomorrowForecastEmails();
    });

    console.log("Scheduler started (09:00, 13:00, 20:00, 22:00)");
}

module.exports = { startScheduler };