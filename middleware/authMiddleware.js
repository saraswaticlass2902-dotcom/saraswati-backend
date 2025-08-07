//middleware/authMiddleware.js  


const jwt = require("jsonwebtoken");
const Registration = require("../models/Registration");

const defaultAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;  

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Registration.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
module.exports = defaultAuth;

