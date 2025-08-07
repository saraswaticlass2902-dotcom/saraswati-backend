//models/chatModel.js

const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  email: String,
  message: String,
  time: String,
  read: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Chat", chatSchema);
