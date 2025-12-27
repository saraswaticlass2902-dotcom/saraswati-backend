const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.cookies.token; // ✅ FIX HERE
    if (!token) {
      return res.status(401).json({ message: "Admin not logged in" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid admin token" });
  }
};

module.exports = verifyAdminToken;
