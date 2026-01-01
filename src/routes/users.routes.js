const express = require("express");
const router = express.Router();

const usersController = require("../controllers/users.controller");

router.post("/", usersController.createOrUpdateUser);
router.get("/", usersController.listUsers);
router.post("/test-email", usersController.sendTestEmail);

module.exports = router;