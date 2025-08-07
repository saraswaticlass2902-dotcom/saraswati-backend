
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Registration = require("../models/Registration");
const authMiddleware = require("../middleware/authMiddleware");



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads")); 
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });





router.post("/upload", upload.single("profileImage"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  res.status(200).json({
    message: "Image uploaded successfully",
    filename: req.file.filename,
  });
});





router.get("/details", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await Registration.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profileImageUrl = user.profileImage
      ? `http://localhost:5000/uploads/${user.profileImage}`
      : null;

    res.status(200).json({
      username: user.username,
      email: user.email,
      profileImage: profileImageUrl,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});




router.post("/update-image", authMiddleware, upload.single("profileImage"), async (req, res) => {
  try {
    const image = req.file?.filename;

    if (!image) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    await Registration.updateOne({ email: req.user.email }, { profileImage: image });

    res.json({
      message: "Image updated successfully!",
      profileImage: `http://localhost:5000/uploads/${image}`,
    });
  } catch (err) {
    console.error("Image update error:", err);
    res.status(500).json({ message: "Failed to update image" });
  }
});

module.exports = router;
