const express = require("express");
const router = express.Router();

const defaultAuth = require("../middleware/defaultAuth");
const adminAuth = require("../middleware/adminAuth");
const profileController = require("../controllers/profileController");

// ================= USER PROFILE =================
// Logged-in user → own profile (DashMenuBar)
router.get("/details", defaultAuth, profileController.getProfile);
router.post("/update", defaultAuth, profileController.updateProfile);

// ================= ADMIN VIEW USER PROFILE =================
// Admin → view any user's profile by email
router.get(
  "/details/:email",
  adminAuth,
  profileController.getProfileByEmail
);

module.exports = router;
