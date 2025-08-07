//controllers/chatControoler.js  

const Chat = require("../models/chatModel");


exports.saveMessage = async (req, res) => {
  try {
    const { sender, receiver, email, message, time } = req.body;

    const chat = new Chat({ sender, receiver, email, message, time, read: false });
    await chat.save();

    res.status(201).json({ message: "Message saved", chat });
  } catch (err) {
    res.status(500).json({ error: "Failed to save message", details: err.message });
  }
};






exports.getMessagesByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const messages = await Chat.find({ email }).sort({ time: 1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};





exports.getUnreadCounts = async (req, res) => {
  try {
    const unreadCounts = await Chat.aggregate([
      { $match: { read: false, receiver: "admin" } },
      {
        $group: {
          _id: "$email",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json(unreadCounts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch unread counts." });
  }
};



exports.markMessagesAsRead = async (req, res) => {
  try {
    const email = req.params.email;

    await Chat.updateMany(
      { email, receiver: "admin", read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ message: "Messages marked as read." });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark messages as read." });
  }
};