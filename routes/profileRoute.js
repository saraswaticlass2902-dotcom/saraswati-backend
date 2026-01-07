const express = require("express");
const router = express.Router();

const defaultAuth = require("../middleware/defaultAuth");
const adminAuth = require("../middleware/adminAuth");
const upload = require("../middleware/upload"); // ✅ ADD THIS
const profileController = require("../controllers/profileController");

// ================= USER PROFILE =================
// Logged-in user → own profile (DashMenuBar)
router.get("/details", defaultAuth, profileController.getProfile);
router.post("/update", defaultAuth, profileController.updateProfile);

// ✅ PROFILE PHOTO UPLOAD (IMPORTANT)
router.post(
  "/upload-photo",
  defaultAuth,
  upload.single("photo"), // 🔴 must match frontend
  profileController.uploadProfilePhoto
);

// ================= ADMIN VIEW USER PROFILE =================
// Admin → view any user's profile by email
router.get(
  "/details/:email",
  adminAuth,
  profileController.getProfileByEmail
);

module.exports = router;
