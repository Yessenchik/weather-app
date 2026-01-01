const express = require("express");
const router = express.Router();

const weatherController = require("../controllers/weather.controller");

router.get("/search", weatherController.searchCity);

// favorites collection
router.get("/", weatherController.listFavorites);
router.post("/", weatherController.addFavoriteCity);

router.get("/:city", weatherController.getFavoriteCity);
router.delete("/:city", weatherController.deleteFavoriteCity);

module.exports = router;