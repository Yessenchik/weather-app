const fs = require("fs");
const path = require("path");

const logFilePath = path.join(__dirname, "..", "..", "requests.log");

module.exports = (req, res, next) => {
    const timestamp = new Date().toLocaleString("en-GB", {
        timeZone: "Asia/Almaty",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    const ip =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip;

    const logLine = `[${timestamp}] ${ip} ${req.method} ${req.originalUrl}\n`;

    console.log(logLine.trim());

    fs.appendFile(logFilePath, logLine, (err) => {
        if (err) {
            console.error("Failed to write requests.log:", err.message);
        }
    });

    next();
};