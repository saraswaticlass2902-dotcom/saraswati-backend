const express = require("express");
const router = express.Router();

const { submitMessage, getAllMessages,updateContactStatus} = require("../controllers/contactController");

router.post("/contact", submitMessage);
router.get("/admin/contact", getAllMessages);
router.put("/admin/update-status/:id", updateContactStatus);


module.exports = router;
