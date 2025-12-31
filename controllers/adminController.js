// controllers/adminController.js
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Registration = require("../models/Registration");
const Contact = require("../models/contactMessage");
const Transaction = require("../models/Transaction");
const Balance = require("../models/Balance");
const Stock = require("../models/Stock");

/* =====================================================
   ADMIN REGISTRATION (WITH SECRET CODE)
===================================================== */
exports.createAdmin = async (req, res) => {
  try {
    const { email, password, secret } = req.body;

    if (!email || !password || !secret) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 🔐 SECRET VERIFY
    if (secret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: "Invalid admin secret code" });
    }

    const normalized = String(email).toLowerCase().trim();

    const existing = await Registration.findOne({ email: normalized });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Registration.create({
      email: normalized,
      password: hashedPassword,
      role: "admin",
    });

    return res.status(201).json({
      message: "Admin created successfully",
    });
  } catch (err) {
    console.error("createAdmin error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};



exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Email & password required" });
    }

    const normalized = String(email).toLowerCase().trim();

    const admin = await Registration.findOne({
      email: normalized,
      role: "admin",
    });

    if (!admin) {
      return res.status(401).json({ ok: false, message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    // 🔥 SAME TOKEN AS USER LOGIN
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    // 🔥 SAME COOKIE NAME
    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    //   maxAge: 3 * 24 * 60 * 60 * 1000,
    // });

    res.cookie("token", token, {
  httpOnly: true,
  secure: true,        // 🔥 MUST (Vercel + Render)
  sameSite: "None",    // 🔥 MUST
  maxAge: 3 * 24 * 60 * 60 * 1000,
});

    // 🔥 IMPORTANT RESPONSE
    return res.status(200).json({
      ok: true,
      user: {
        email: admin.email,
        role: "admin",
      },
    });
  } catch (err) {
    console.error("adminLogin error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

/* =====================================================
   ADMIN LOGOUT
===================================================== */
exports.adminLogout = async (req, res) => {
  try {
    res.clearCookie("adminToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    return res.status(200).json({ message: "Admin logged out successfully" });
  } catch (err) {
    console.error("adminLogout error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   DASHBOARD DATA
===================================================== */
exports.getUserCount = async (req, res) => {
  try {
    const count = await Registration.countDocuments({ role: "user" });
    return res.status(200).json({ count });
  } catch (err) {
    console.error("getUserCount error:", err);
    return res.status(500).json({ message: "Failed to fetch user count" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await Registration.find({ role: "user" })
      .select("username email role createdAt");

    return res.status(200).json({ success: true, users });
  } catch (err) {
    console.error("getAllUsers error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

/* =====================================================
   DELETE USER + RELATED DATA
===================================================== */
exports.deleteUserAndData = async (req, res) => {
  try {
    const email = String(req.params.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await Registration.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    await Registration.deleteOne({ email });
    await Balance.deleteOne({ email });
    await Stock.deleteMany({ email });
    await Transaction.deleteMany({ email });

    return res.status(200).json({
      message: "User and related data deleted successfully",
    });
  } catch (err) {
    console.error("deleteUserAndData error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   CONTACT MESSAGES
===================================================== */
exports.getAllContactMessages = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, contacts });
  } catch (err) {
    console.error("getAllContactMessages error:", err);
    return res.status(500).json({ success: false, message: "Error fetching contact messages" });
  }
};

/* =====================================================
   USER TRANSACTIONS / BALANCE / STOCK
===================================================== */
exports.getTransactionsByEmail = async (req, res) => {
  try {
    const email = String(req.params.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await Registration.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const transactions = await Transaction.find({ email }).sort({ date: -1 });

    return res.status(200).json({
      email: user.email,
      username: user.username,
      transactions,
    });
  } catch (err) {
    console.error("getTransactionsByEmail error:", err);
    return res.status(500).json({ message: "Error fetching transactions" });
  }
};

exports.getBalanceByEmail = async (req, res) => {
  try {
    const email = String(req.params.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ message: "Email required" });

    const userBalance = await Balance.findOne({ email });
    return res.status(200).json({
      balance: userBalance ? userBalance.balance : 0,
    });
  } catch (err) {
    console.error("getBalanceByEmail error:", err);
    return res.status(500).json({ message: "Error fetching balance" });
  }
};

exports.getStockByEmail = async (req, res) => {
  try {
    const email = String(req.params.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await Registration.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found", stocks: [] });
    }

    const stocks = await Stock.find({ email }).sort({ createdAt: -1 });

    return res.status(200).json({
      username: user.username,
      stocks,
    });
  } catch (err) {
    console.error("getStockByEmail error:", err);
    return res.status(500).json({ message: "Error fetching stock history" });
  }
};

/* =====================================================
   USERS EMAIL LIST
===================================================== */
exports.getAllUsersEmail = async (req, res) => {
  try {
    const users = await Registration.find({ role: "user" })
      .select("username email");

    return res.status(200).json({ success: true, users });
  } catch (err) {
    console.error("getAllUsersEmail error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Registration.find(
      { role: { $in: ["admin", "superadmin"] } }, // 👈 only admins
      { email: 1, role: 1, createdAt: 1 }
    ).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      admins,
    });
  } catch (error) {
    console.error("Get admins error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admins",
    });
  }
};

