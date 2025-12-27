const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },

    username: String,

    // Student
    studentName: String,
    dob: Date,
    gender: String,
    village: String,

    // Parent
    parentName: String,
    parentEmail: String,
    parentContact: String,

    // Education
    standard: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
