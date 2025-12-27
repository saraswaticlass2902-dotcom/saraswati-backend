// models/Verification.js
const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    // 🔥 otpToken optional (needed for register/forgot, not for delete)
    otpToken: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // IMPORTANT for optional unique field
    },

    // 🔥 allow delete purpose
    purpose: {
      type: String,
      enum: ["register", "forgot", "delete"],
      required: true,
    },

    verified: {
      type: Boolean,
      default: false,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: 600 }, // TTL ~10 min
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model("Verification", verificationSchema);
