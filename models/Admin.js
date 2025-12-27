// models/Admin.js

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // 🔐 password default fetch होणार नाही
    },

    role: {
      type: String,
      enum: ["admin", "superadmin"], // 🔥 future ready
      default: "admin",
    },
  },
  {
    timestamps: true, // 🕒 createdAt, updatedAt
  }
);

/* ================= PASSWORD HASH ================= */
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* ================= PASSWORD COMPARE (LOGIN) ================= */
adminSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);
