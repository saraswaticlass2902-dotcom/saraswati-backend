const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const defaultAuth = require("../middleware/authMiddleware");

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/logout", authController.logoutUser);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOtp);
router.post("/change-password", defaultAuth, authController.changePassword);
router.delete("/delete-account", defaultAuth, authController.deleteAccount);
router.get("/all", authController.getAllUsers);


module.exports = router;
