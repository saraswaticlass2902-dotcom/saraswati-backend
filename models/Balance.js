//Balance.js model


const mongoose = require("mongoose");

const balanceSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true
});

module.exports = mongoose.model("Balance", balanceSchema);
