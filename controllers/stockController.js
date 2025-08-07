//controllers/stockControoler.js  

const Stock = require("../models/Stock");
const Balance = require("../models/Balance");

exports.buyStock = async (req, res) => {
  try {
    const { name, price, volume } = req.body;
    const email = req.user.email;

    const amount = Number(price) * Number(volume);
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const balanceDoc = await Balance.findOne({ email });
    const currentBalance = balanceDoc?.balance || 0;

    if (currentBalance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    await Balance.updateOne(
      { email },
      { $inc: { balance: -amount } },
      { upsert: true }
    );

    await Stock.create({
      email,
      name,
      price,
      volume,
      amount,
      type: "buy",
    });

    res.json({ success: true, message: "Buy successful" });
  } catch (err) {
    console.error("Buy error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};






exports.sellStock = async (req, res) => {
  try {
    const { name, price, volume } = req.body;
    const email = req.user.email;

    const amount = Number(price) * Number(volume);
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    await Balance.updateOne(
      { email },
      { $inc: { balance: amount } },
      { upsert: true }
    );

    await Stock.create({
      email,
      name,
      price,
      volume,
      amount,
      type: "sell",
    });

    res.json({ success: true, message: "Sell successful" });
  } catch (err) {
    console.error("Sell error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};






exports.getUserStocks = async (req, res) => {
  try {
    const email = req.user.email;
    const stocks = await Stock.find({ email }).sort({ createdAt: -1 });

    res.json({ success: true, stocks });
  } catch (err) {
    console.error("Fetch history error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
