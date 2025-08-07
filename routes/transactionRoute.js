const express = require("express");
const router = express.Router();
const defaultAuth = require("../middleware/authMiddleware"); 

const {
  addTransaction,
  getTransactions,
  getBalance,
} = require("../controllers/transactionController");

router.post("/add", defaultAuth, addTransaction);
router.get("/list", defaultAuth, getTransactions);
router.get("/balance", defaultAuth, getBalance);

module.exports = router;
