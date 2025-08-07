const express = require("express");
const router = express.Router();
const defaultAuth = require("../middleware/authMiddleware");


const { buyStock, sellStock, getUserStocks } = require("../controllers/stockController");

router.post("/buy", defaultAuth, buyStock);
router.post("/sell", defaultAuth, sellStock);
router.get("/user", defaultAuth, getUserStocks);

module.exports = router;
