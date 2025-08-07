// models/contactMessage.js


const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  age: String,
  type: String,
  message: String,
  captcha: String,
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contact', contactSchema);
