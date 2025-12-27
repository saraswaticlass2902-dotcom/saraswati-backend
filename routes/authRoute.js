const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// ✅ Correct middleware path
const defaultAuth = require("../middleware/defaultAuth");

// -------- User Registration --------
router.post("/register", authController.registerUser);

// -------- Login / Logout --------
router.post("/login", authController.loginUser);
router.post("/logout", authController.logout);

// -------- Forgot Password --------
router.post("/forgot-password", authController.forgotPassword);

// -------- Verify OTP --------
router.post("/verify-otp", authController.verifyOtp);

// -------- Check Email --------
router.post("/check-email", authController.checkEmail);

// 🔐 CHANGE PASSWORD
router.post(
  "/change-password",
  defaultAuth,
  authController.changePassword
);

// 🔐 DELETE ACCOUNT WITH OTP (ONLY WAY)
router.post("/delete-account-otp", defaultAuth, authController.sendDeleteOtp);
router.post("/verify-delete-otp", defaultAuth, authController.verifyDeleteOtp);


// 🔥 SESSION CHECK
router.get("/me", defaultAuth, (req, res) => {
  res.status(200).json({
    ok: true,
    user: {
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = router;
