const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");


router.post("/save", chatController.saveMessage);
router.get("/get/:email", chatController.getMessagesByEmail);
router.get("/unread-count", chatController.getUnreadCounts);
router.put("/mark-read/:email", chatController.markMessagesAsRead);

module.exports = router;
