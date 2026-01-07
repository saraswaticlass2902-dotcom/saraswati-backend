const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile_photos",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [
      { width: 300, height: 300, crop: "fill" },
    ],
  },
});

module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
