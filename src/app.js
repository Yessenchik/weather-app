const express = require("express");
const path = require("path");
require("dotenv").config();

const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler")

const weatherRoutes = require("./routes/weather.routes");
const usersRoutes = require("./routes/users.routes");
const notificationsRoutes = require("./routes/notifications.routes");

const app = express();

// global middleware
app.use(express.json());

// request logger first
app.use(requestLogger);

// api routes
app.use("/api/weather", weatherRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/notifications", notificationsRoutes)

// frontend
app.use(express.static(path.join(__dirname, "..", "public")))

// simple health check
app.get("/api/health", (req, res) => {
    res.json({ok: true})
});

// basic 404 for unknown api routes
app.use("/api", (req, res) => {
    res.status(404).json({error: "API route not found"})
});

app.use(errorHandler)

module.exports = app;