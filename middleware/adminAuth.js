const jwt = require("jsonwebtoken");
const Registration = require("../models/Registration");

const adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token; // ✅ SAME COOKIE AS LOGIN
    if (!token) {
      return res.status(401).json({ message: "No admin token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Registration.findOne({
      _id: decoded.id,
      role: "admin",
    });

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid admin token" });
  }
};

module.exports = adminAuth;
