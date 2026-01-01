// const cron = require("node-cron");
// const { getUsers, saveUsers } = require("../services/users.service");
// const { getCurrentWeatherByCity } = require("../services/openweather.service");
// const { sendEmail } = require("../services/email.service");
//
// function startScheduledEmailWorker() {
//     cron.schedule("* * * * *", async () => {
//         const now = Date.now();
//
//         const users = await getUsers();
//         let changed = false;
//
//         for (const user of users) {
//             if (!user.schedule_at_ms) continue;
//
//             // allow a small window (2 minutes) in case of minute boundaries
//             const due = Number(user.schedule_at_ms);
//             const windowMs = 2 * 60 * 1000;
//
//             if (Number.isNaN(due)) {
//                 user.schedule_at_ms = null;
//                 changed = true;
//                 continue;
//             }
//
//             const isDue = due <= now && (now - due) <= windowMs;
//
//             if (isDue) {
//                 try {
//                     const w = await getCurrentWeatherByCity(user.city);
//
//                     const subject = `Scheduled weather: ${w.city}`;
//                     const text =
//                         `City: ${w.city}\n` +
//                         `Temp: ${w.temperature}°C (feels like ${w.feels_like}°C)\n` +
//                         `Description: ${w.description}\n` +
//                         `Humidity: ${w.humidity}%\n` +
//                         `Wind: ${w.wind_speed} m/s\n` +
//                         `Rain(3h): ${w.rain_last_3h}\n`;
//
//                     await sendEmail(user.email, subject, text);
//                     console.log(" Scheduled email sent:", user.email, "due:", new Date(due).toString());
//                 } catch (err) {
//                     console.error(" Scheduled email failed:", user.email, err.message);
//                 }
//
//                 user.schedule_at_ms = null; // one-time schedule
//                 changed = true;
//             } else {
//                 console.log(
//                     "⏳ Not due:",
//                     user.email,
//                     "now:",
//                     new Date(now).toString(),
//                     "due:",
//                     new Date(due).toString()
//                 );
//             }
//         }
//
//         if (changed) {
//             await saveUsers(users);
//         }
//     });
//
//     console.log("ScheduledEmailWorker started (every minute)");
// }
//
// module.exports = { startScheduledEmailWorker };