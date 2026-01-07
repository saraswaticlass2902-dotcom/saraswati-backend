// models/Course.js
const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: String,
    price: Number,
    category: String,
    duration: String,
    instructor: String,
    description: String,

    // ✅ SAME AS PROFILE PHOTO
    thumbnail: String,              // Cloudinary URL
    thumbnailPublicId: String,       // Cloudinary public_id
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
