// const express = require("express");
// const router = express.Router();

// const authController = require("../controllers/authController");
// const defaultAuth = require("../middleware/defaultAuth");

// /* ================= USER AUTH ================= */

// // 🔹 STEP 1: Check email & send OTP
// router.post("/check-email", authController.checkEmail);

// // 🔹 STEP 2: Verify OTP
// router.post("/verify-otp", authController.verifyOtp);

// // 🔹 STEP 3: Register user (after OTP verified)
// router.post("/register", authController.registerUser);

// // 🔹 Login / Logout
// router.post("/login", authController.loginUser);
// router.post("/logout", authController.logout);

// // 🔹 Forgot password (send OTP)
// router.post("/forgot-password", authController.forgotPassword);

// /* ================= PROTECTED ROUTES ================= */

// // 🔐 Change password
// router.post("/change-password", defaultAuth, authController.changePassword);

// // 🔐 Delete account (OTP flow)
// router.post(
//   "/delete-account-otp",
//   defaultAuth,
//   authController.sendDeleteOtp
// );

// router.post(
//   "/verify-delete-otp",
//   defaultAuth,
//   authController.verifyDeleteOtp
// );

// // 🔥 Session check (used by frontend)
// router.get("/me", defaultAuth, (req, res) => {
//   res.status(200).json({
//     ok: true,
//     user: {
//       id: req.user._id,
//       email: req.user.email,
//       role: req.user.role,
//     },
//   });
// });

// module.exports = router;

const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const defaultAuth = require("../middleware/defaultAuth");

/* ================= PUBLIC ROUTES ================= */

// check email availability
router.post("/check-email", authController.checkEmail);

// register (email + password)
router.post("/firebase-save", authController.saveFirebaseUser);


// login
router.post("/login", authController.loginUser);

// logout
router.post("/logout", authController.logout);

/* ================= PROTECTED ROUTES ================= */

router.get("/me", defaultAuth, (req, res) => {
  res.status(200).json({
    ok: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = router;
