//controllers/authControoler.js  



const Registration = require("../models/Registration");
const path = require("path");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM;





exports.registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isStrongPassword = (pass) => pass.length >= 6;

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({ message: "Password too weak. Use at least 6 characters." });
  }

  try {
    const existingUser = await Registration.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Registration({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};







exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Registration.findOne({ email }); 
    if (!user) return res.status(401).json({ message: "Invalid email" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, 
      sameSite: "Lax",
      maxAge: 3 * 24 * 60 * 60 * 1000, 
    });

    res.status(200).json({ message: "Login successful" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};






exports.logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  });
  res.json({ message: "Logged out" });
};





exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await Registration.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; 

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const msg = {
      to: email,
      from: EMAIL_FROM,
      subject: "Next Investment - OTP for Password Reset",
      html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
    };

    await sgMail.send(msg);
    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};






exports.verifyOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await Registration.findOne({ email, otp });
    if (!user) return res.status(400).json({ message: "Invalid OTP" });

    if (user.otpExpires && user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};






exports.changePassword = async (req, res) => {
  try {
    const email = req.user.email;
    const { oldPassword, newPassword } = req.body;

    const user = await Registration.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(400).json({ error: "Old password is incorrect" });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ error: "Server error" });
  }
};



exports.deleteAccount = async (req, res) => {
  try {
    const userEmail = req.user.email;

    const deletedUser = await Registration.findOneAndDelete({ email: userEmail });

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Server error while deleting account" });
  }
};





exports.getMyProfile = async (req, res) => {
  try {
    const user = await Registration.findOne({ email: req.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      email: user.email,
      image: user.image,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};






exports.uploadProfileImage = async (req, res) => {
  try {
    const email = req.user.email;
    const imagePath = req.file.path;

    await Registration.findOneAndUpdate(
      { email },
      { profileImage: imagePath },
      { new: true }
    );

    res.status(200).json({ message: "Image uploaded", imagePath });
  } catch (err) {
    res.status(500).json({ error: "Upload failed" });
  }
};





exports.getAllUsers = async (req, res) => {
  try {
    const users = await Registration.find({ role: "user" }).select("username email");
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};
