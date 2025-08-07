//models/Transaction.js


const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Registration",
    required: true,
  },
  email: String,
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["Deposit", "Withdraw", "Buy", "Sell"],
    required: true,
  },
  status: {
    type: String,
    default: "Success",
  },
  bankName: String,
  bankNumber: String,
  ifsc: String,
  mobile: String,
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Transaction", transactionSchema);
