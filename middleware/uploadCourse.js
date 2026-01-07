// middleware/uploadCourse.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "course_thumbnails",     // 👈 profile_photos सारखाच
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 600, height: 400, crop: "fill" }],
  },
});

module.exports = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
});
