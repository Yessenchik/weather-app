const express = require("express");
const router = express.Router();

const notificationsController = require("../controllers/notifications.controller");

router.get("/scheduled", notificationsController.listScheduled);

router.delete("/scheduled/:email", notificationsController.cancelSchedule);

router.post("/run-once", notificationsController.runWorkerOnce);

module.exports = router;