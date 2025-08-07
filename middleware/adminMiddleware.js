// middlewares/adminMiddleware.js


const jwt = require("jsonwebtoken");

const verifyAdminToken = (req, res, next) => {
  const token = req.cookies.adminToken;

  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

module.exports = verifyAdminToken;

