//models/Stock.js


const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    volume: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("Stock", stockSchema);
