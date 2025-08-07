const express = require("express");
const router = express.Router();
const { getAllUsersemail ,adminLogin, adminLogout,getUserCount,getAllUsers ,getAllContactMessages, deleteUserAndData, getTransactionsByEmail,getBalanceByEmail,getStockByEmail} = require("../controllers/adminController");

const defaultAuth=require("../middleware/adminMiddleware");


router.post("/admin-login", adminLogin);
router.post("/admin-logout", adminLogout); 
router.get("/user-count", getUserCount);
router.get("/all-users", defaultAuth, getAllUsers);
router.get("/all-contacts", defaultAuth, getAllContactMessages);
router.delete("/delete-user/:email", defaultAuth, deleteUserAndData);
router.get("/transactions/:email", defaultAuth, getTransactionsByEmail);
router.get("/balance/:email", defaultAuth, getBalanceByEmail);
router.get("/byemail/:email", defaultAuth,getStockByEmail);
router.get("/all-email", defaultAuth, getAllUsersemail );



module.exports = router;
