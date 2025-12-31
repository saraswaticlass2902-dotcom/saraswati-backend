

const express = require("express");
const router = express.Router();

// ✅ CONTROLLER
const adminController = require("../controllers/adminController");

// ✅ ADMIN AUTH MIDDLEWARE
const adminAuth = require("../middleware/adminAuth");

// =====================================================
// ADMIN AUTH
// =====================================================
router.post("/create", adminController.createAdmin);
router.post("/login", adminController.adminLogin);
router.post("/logout", adminController.adminLogout);

// =====================================================
// ADMIN INFO
// =====================================================
router.get("/me", adminAuth, (req, res) => {
  res.status(200).json({
    ok: true,
    admin: {
      email: req.admin.email,
      role: req.admin.role,
    },
  });
});

// =====================================================
// ADMINS
// =====================================================
router.get(
  "/all-admins",
  adminAuth,
  adminController.getAllAdmins
);

// =====================================================
// DASHBOARD DATA
// =====================================================
router.get("/users/count", adminAuth, adminController.getUserCount);
router.get("/users", adminAuth, adminController.getAllUsers);
router.get("/users/emails", adminAuth, adminController.getAllUsersEmail);

// =====================================================
// USER MANAGEMENT
// =====================================================
router.delete(
  "/user/:email",
  adminAuth,
  adminController.deleteUserAndData
);

router.get(
  "/transactions/:email",
  adminAuth,
  adminController.getTransactionsByEmail
);

router.get(
  "/balance/:email",
  adminAuth,
  adminController.getBalanceByEmail
);

router.get(
  "/stock/:email",
  adminAuth,
  adminController.getStockByEmail
);

// =====================================================
// CONTACT MESSAGES
// =====================================================
router.get(
  "/contacts",
  adminAuth,
  adminController.getAllContactMessages
);

module.exports = router;
