// controllers/adminController.js



const Admin = require("../models/Admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); 
const Registration = require('../models/Registration');
const Contact = require("../models/contactMessage");
const Transaction = require("../models/Transaction");
const Balance = require("../models/Balance"); 
const Stock = require("../models/Stock");





const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) return res.status(400).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
    
    const token = jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET || "your_jwt_secret", {
      expiresIn: "1h",
    });

    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: false, 
      sameSite: "Lax",
      maxAge: 60 * 60 * 1000, 
    });

    res.status(200).json({ message: "Admin login successful", email: admin.email });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};






const adminLogout = (req, res) => {
  res.clearCookie("adminToken"); 
  res.status(200).json({ message: "Admin logged out successfully" });
};




const getUserCount = async (req, res) => {
  try {
    const count = await Registration.countDocuments({ role: "user" }); 
    res.json({ count });
  } catch (error) {
    console.error("Error fetching user count:", error);
    res.status(500).json({ error: "Failed to fetch user count" });
  }
};





const getAllUsers = async (req, res) => {
  try {
    const users = await Registration.find({ role: "user" }).select("username email role");
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};





const deleteUserAndData = async (req, res) => {
  try {
    const { email } = req.params;

    const user = await Registration.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
   
    await Registration.deleteOne({ email });
    await Balance.deleteOne({ email });
    await Stock.deleteMany({ email });
    await Transaction.deleteMany({ email });

    return res.status(200).json({ message: "User and related data deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};




const getAllContactMessages = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching contact messages", error: error.message });
  }
};







const getTransactionsByEmail = async (req, res) => {
  try {
    const email = req.params.email;

    const user = await Registration.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const transactions = await Transaction.find({ email }).sort({ date: -1 });
    res.json({
      transactions,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error("Error in getTransactionsByEmail:", error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
};







const getBalanceByEmail = async (req, res) => {
  try {
    const email = req.params.email;
    const userBalance = await Balance.findOne({ email });

    if (!userBalance) {
      return res.json({ balance: 0 });
    }

    res.json({ balance: userBalance.balance });
  } catch (error) {
    res.status(500).json({ message: "Error fetching balance" });
  }
};






const getStockByEmail = async (req, res) => {
  try {
    const email = req.params.email;
    const user = await Registration.findOne({ email });

    if (!user) {
      return res.json({
        username: "User Not Found",
        stocks: [],
      });
    }
    const stocks = await Stock.find({ email }).sort({ createdAt: -1 });
    res.json({
      username: user.username,
      stocks,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stock history" });
  }
};








const getAllUsersemail = async (req, res) => {
  try {
    const users = await Registration.find({ role: "user" }).select("username email");
    res.status(200).json({ success: true, users }); 
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};






module.exports = {getAllUsersemail ,getStockByEmail , deleteUserAndData,getBalanceByEmail , getTransactionsByEmail,adminLogin, adminLogout,getUserCount ,getAllUsers,getAllContactMessages };
