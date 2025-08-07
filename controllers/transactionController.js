////controllers/transactionControoler.js  


const Transaction = require("../models/Transaction");
const Balance = require("../models/Balance"); 
const mongoose = require("mongoose");
const Auth = require("../models/Registration");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


exports.addTransaction = async (req, res) => {
  try {
    const { amount, type, bankName, bankNumber, ifsc, mobile } = req.body;
    const userEmail = req.user.email;
    const userId = req.user._id;

    const numericAmount = Number(amount);
    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (!["Deposit", "Withdraw", "Buy", "Sell"].includes(type)) {
      return res.status(400).json({ error: "Invalid transaction type" });
    }

    let balanceDoc = await Balance.findOne({ email: userEmail });
    let currentBalance = balanceDoc ? balanceDoc.balance : 0;

    if (type === "Withdraw" && numericAmount > currentBalance) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const updatedBalance =
      type === "Deposit" || type === "Sell"
        ? currentBalance + numericAmount
        : currentBalance - numericAmount;

    await Balance.findOneAndUpdate(
      { email: userEmail },
      { $set: { balance: updatedBalance } },
      { upsert: true, new: true }
    );

    const transaction = new Transaction({
      user: userId,             
      email: userEmail,
      amount: numericAmount,
      type,
      status: "Success",
      bankName: type === "Withdraw" ? bankName : "",
      bankNumber: type === "Withdraw" ? bankNumber : "",
      ifsc: type === "Withdraw" ? ifsc : "",
      mobile: type === "Withdraw" ? mobile : ""
    });

    await transaction.save();
    res.status(200).json({ message: `${type} successful` });

  } catch (err) {
    console.error("Add Transaction Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
};






exports.getTransactions = async (req, res) => {
  try {
    const email = req.user.email;
    const transactions = await Transaction.find({ email }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error("Get Transactions Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
};





exports.getBalance = async (req, res) => {
  try {
    const email = req.user.email;
    const balanceDoc = await Balance.findOne({ email });
    const balance = balanceDoc?.balance || 0;
    res.json({ balance });
  } catch (err) {
    console.error("Get Balance Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
};






const calculateUserBalance = async (email) => {
  const transactions = await Transaction.find({ email });
  let balance = 0;
  for (let tx of transactions) {
    const type = tx.type?.toLowerCase();
    const amount = Number(tx.amount);

    if (isNaN(amount)) continue;
    if (type === "deposit") balance += amount;
    else if (type === "withdraw" || type === "buy") balance -= amount;
    else if (type === "sell") balance += amount;
  }
  return balance;
};
