

// // controllers/authController.js (patched)
// const Registration = require("../models/Registration");
// const Verification = require("../models/Verification");
// const bcrypt = require("bcrypt");
// const nodemailer = require("nodemailer");
// const crypto = require("crypto");
// const { body, validationResult } = require("express-validator");
// const { v4: uuidv4 } = require("uuid");
// const jwt = require("jsonwebtoken");


// const Transaction = require("../models/Transaction");
// const Balance = require("../models/Balance");
// const Stock = require("../models/Stock");


// // Email transporter (Gmail - App Password recommended)
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });
// const EMAIL_FROM = process.env.EMAIL_USER || "no-reply@example.com";

// // Optional: verify transporter at startup to fail early if credentials are wrong
// transporter.verify().then(() => {
//   console.log("Email transporter OK");
// }).catch((err) => {
//   console.warn("Email transporter verify failed (emails may not send):", err && err.message);
// });

// // Helpers
// function generateNumericOtp(len = 6) {
//   let otp = "";
//   for (let i = 0; i < len; i++) otp += Math.floor(Math.random() * 10);
//   return otp;
// }
// function hashOtp(otp) {
//   return crypto.createHash("sha256").update(String(otp)).digest("hex");
// }


// exports.checkEmail = [
//   body("email").isEmail().withMessage("Valid email required"),
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

//     try {
//       const { email } = req.body;
//       const normalized = String(email).toLowerCase().trim();

//       // If user exists, let frontend know (stop register flow)
//       const existingUser = await Registration.findOne({ email: normalized });
//       if (existingUser) return res.status(200).json({ exists: true, message: "Email already registered" });

//       // Rate limit check
//       const last = await Verification.findOne({ email: normalized, purpose: "register" }).sort({ createdAt: -1 });
//       const RATE_LIMIT_SECONDS = parseInt(process.env.OTP_RATE_LIMIT_SECONDS || "60", 10);
//       if (last && (Date.now() - last.createdAt.getTime()) / 1000 < RATE_LIMIT_SECONDS) {
//         return res.status(429).json({ message: `Please wait before requesting a new OTP.` });
//       }

//       // Create OTP, hash, and create Verification record
//       const otp = generateNumericOtp(6);
//       console.log("DEBUG OTP:", otp); // Temporary debug log
//       const otpHash = hashOtp(otp);
//       const otpToken = uuidv4();
//       const OTP_TTL_MS = parseInt(process.env.OTP_TTL_MS || String(10 * 60 * 1000), 10);
//       const expiresAt = new Date(Date.now() + OTP_TTL_MS);

//       await Verification.create({
//         email: normalized,
//         otpHash,
//         otpToken,
//         purpose: "register",
//         expiresAt,
//         attempts: 0,
//         verified: false,
//       });

//       // Send OTP email (fire-and-forget)
//       (async () => {
//         try {
//           await transporter.sendMail({
//             from: EMAIL_FROM,
//             to: normalized,
//             subject: "Saraswati Classes - Registration OTP",
//             html: `
//               <div style="font-family: Arial, sans-serif; text-align:center; padding:20px;">
//                 <h2 style="color:#0d6efd;">Saraswati Classes</h2>
//                 <p>Your OTP is valid for ${Math.floor(OTP_TTL_MS/60000)} minutes</p>
//                 <div style="font-size:28px; letter-spacing:6px; font-weight:bold; background:#0d6efd; color:#fff; padding:10px 18px; border-radius:6px;">${otp}</div>
//                 <p style="font-size:12px; color:#666; margin-top:10px;">Do not share this OTP with anyone.</p>
//               </div>
//             `,
//           });
//           console.log("Registration OTP email queued for", normalized);
//         } catch (err) {
//           // log but do not fail the request (avoid exposing mail errors to clients)
//           console.error("Error sending registration OTP email:", err && err.message ? err.message : err);
//         }
//       })();

//       console.log("Generated registration otpToken for email:", normalized);
//       return res.status(200).json({
//         exists: false,
//         otpToken,
//         resendAfter: RATE_LIMIT_SECONDS,
//         message: "OTP sent to email"
//       });
//     } catch (err) {
//       console.error("checkEmail error:", err);
//       return res.status(500).json({ message: "Server error" });
//     }
//   },
// ];


// exports.verifyOtp = [
//   body("email").isEmail().withMessage("Valid email required"),
//   body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

//     try {
//       const { email, otp, otpToken, newPassword } = req.body;
//       if (!otpToken) return res.status(400).json({ message: "otpToken required" });

//       const normalized = String(email).toLowerCase().trim();
//       const verification = await Verification.findOne({ email: normalized, otpToken }).sort({ createdAt: -1 });

//       if (!verification) return res.status(400).json({ message: "Invalid token or OTP" });
//       if (verification.verified) return res.status(400).json({ message: "OTP already used" });
//       if (verification.expiresAt < new Date()) return res.status(400).json({ message: "OTP expired" });

//       // increase attempts and persist immediately
//       verification.attempts = (verification.attempts || 0) + 1;
//       const MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || "6", 10);
//       if (verification.attempts > MAX_ATTEMPTS) {
//         await verification.save();
//         return res.status(429).json({ message: "Too many attempts. Request a new OTP." });
//       }

//       const providedHash = hashOtp(String(otp).trim());
//       if (providedHash !== verification.otpHash) {
//         await verification.save(); // persist incremented attempts
//         return res.status(400).json({ message: "Invalid OTP" });
//       }

//       // mark verified
//       verification.verified = true;
//       await verification.save();

//       // ===== NEW: set emailVerified on Registration when purpose is "register" =====
//       if (verification.purpose === "register") {
//         try {
//           await Registration.findOneAndUpdate(
//             { email: normalized },
//             { $set: { emailVerified: true } }
//           );
//         } catch (err) {
//           // log but don't fail the OTP verification response
//           console.error("Error setting emailVerified on user:", err && err.message ? err.message : err);
//         }
//       }

//       // If forgot password flow and newPassword provided -> reset
//       if (verification.purpose === "forgot" && newPassword) {
//         const user = await Registration.findOne({ email: normalized });
//         if (!user) return res.status(404).json({ message: "User not found" });

//         user.password = await bcrypt.hash(String(newPassword), 10);
//         await user.save();

//         // cleanup verifications for this purpose
//         await Verification.deleteMany({ email: normalized, purpose: "forgot" });

//         return res.status(200).json({ success: true, message: "Password reset successful" });
//       }

//       // For register flow, frontend will call /register next
//       return res.status(200).json({ success: true, message: "OTP verified" });
//     } catch (err) {
//       console.error("verifyOtp error:", err);
//       return res.status(500).json({ message: "Server error" });
//     }
//   },
// ];


// // exports.registerUser = [
// //   body("username").trim().notEmpty().withMessage("Username is required"),
// //   body("email").isEmail().withMessage("Valid email required"),
// //   body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
// //   body("otpToken").optional().isString(),

// //   async (req, res) => {
// //     const errors = validationResult(req);
// //     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

// //     try {
// //       let { username, email, password, otpToken } = req.body;
// //       const normalized = String(email).toLowerCase().trim();
// //       username = String(username).trim();

// //       // 1) ensure user not already exists
// //       const existing = await Registration.findOne({ email: normalized });
// //       if (existing && existing.password) {
// //         return res.status(400).json({ message: "User already exists" });
// //       }

// //       // 2) Verify OTP record exists and is verified
// //       let verification;
// //       if (otpToken) {
// //         verification = await Verification.findOne({ email: normalized, otpToken, purpose: "register" });
// //       } else {
// //         verification = await Verification.findOne({ email: normalized, purpose: "register", verified: true }).sort({ createdAt: -1 });
// //       }

// //       if (!verification || !verification.verified) {
// //         return res.status(400).json({ message: "Email not verified. Complete OTP verification first." });
// //       }

// //       // 3) Create user (or update existing placeholder record)
// //       const hashedPassword = await bcrypt.hash(String(password), 10);
// //       const user = await Registration.findOneAndUpdate(
// //         { email: normalized },
// //         { username, email: normalized, password: hashedPassword, role: "user" },
// //         { upsert: true, new: true, setDefaultsOnInsert: true }
// //       );

// //       // 4) Clean up register verifications for this email
// //       await Verification.deleteMany({ email: normalized, purpose: "register" });

// //       // 5) Send welcome email (async)
// //       (async () => {
// //         try {
// //           await transporter.sendMail({
// //             from: EMAIL_FROM,
// //             to: normalized,
// //             subject: "🎉 Welcome to Saraswati Classes — Registration Complete!",
// //             html: `
// //               <div style="font-family: Arial, sans-serif; padding:20px; text-align:center;">
// //                 <h2 style="color:#0d6efd;">Welcome, ${username}!</h2>
// //                 <p>Your account has been created successfully. Login to continue.</p>
// //                 <a href="${process.env.CLIENT_URL || "http://localhost:3000"}/login" style="display:inline-block; padding:10px 18px; background:#0d6efd; color:#fff; border-radius:6px; text-decoration:none;">Login Now</a>
// //               </div>
// //             `,
// //           });
// //         } catch (err) {
// //           console.error("Welcome email error:", err && err.message ? err.message : err);
// //         }
// //       })();

// //       // return minimal user info only
// //       return res.status(201).json({
// //         message: "Registration successful",
// //         user: { id: user._id.toString(), email: user.email, username: user.username }
// //       });
// //     } catch (err) {
// //       console.error("registerUser error:", err);
// //       return res.status(500).json({ message: "Server error during registration" });
// //     }
// //   },
// // ];

// exports.registerUser = [
//   body("username").notEmpty(),
//   body("email").isEmail(),
//   body("password").isLength({ min: 6 }),
//   body("otpToken").notEmpty(),

//   async (req, res) => {
//     try {
//       let { username, email, password, otpToken } = req.body;
//       email = email.toLowerCase().trim();
//       username = username.trim();

//       const exists = await Registration.findOne({ email });
//       if (exists) {
//         return res.status(400).json({ message: "User already exists" });
//       }

//       const verifiedOtp = await Verification.findOne({
//         email,
//         otpToken,
//         purpose: "register",
//         verified: true,
//       });

//       if (!verifiedOtp) {
//         return res
//           .status(400)
//           .json({ message: "Email not verified" });
//       }

//       const hashedPassword = await bcrypt.hash(password, 10);

//       const user = await Registration.create({
//         username,
//         email,
//         password: hashedPassword,
//         role: "user",
//       });

//       await Verification.deleteMany({ email, purpose: "register" });

//       return res.status(201).json({
//         message: "Registration successful",
//         user: {
//           id: user._id,
//           email: user.email,
//           username: user.username,
//         },
//       });
//     } catch (err) {
//       console.error(err);
//       return res.status(500).json({ message: "Server error" });
//     }
//   },
// ];



// // ================= LOGIN USER =================
// // exports.loginUser = async (req, res) => {
// //   try {
// //     const { email, password } = req.body;
// //     const normalized = String(email).toLowerCase().trim();

// //     const user = await Registration.findOne({ email: normalized });
// //     if (!user || !user.password) {
// //       return res.status(401).json({ ok: false, message: "Invalid credentials" });
// //     }

// //     const isMatch = await bcrypt.compare(String(password), user.password);
// //     if (!isMatch) {
// //       return res.status(401).json({ ok: false, message: "Invalid credentials" });
// //     }

// //     const token = jwt.sign(
// //       { id: user._id, email: user.email, role: user.role },
// //       process.env.JWT_SECRET,
// //       { expiresIn: "3d" }
// //     );

// //     // 🔥 FORCE CROSS-DOMAIN COOKIE (VERCEL + RENDER)
// //     res.cookie("token", token, {
// //       httpOnly: true,
// //       secure: true,        // ⭐ MUST
// //       sameSite: "None",    // ⭐ MUST
// //       maxAge: 3 * 24 * 60 * 60 * 1000,
// //     });

// //     return res.status(200).json({
// //       ok: true,
// //       message: "Login successful",
// //       user: {
// //         id: user._id,
// //         email: user.email,
// //         role: user.role,
// //       },
// //     });
// //   } catch (err) {
// //     console.error("loginUser error:", err);
// //     return res.status(500).json({ ok: false, message: "Server error" });
// //   }
// // };


// exports.loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const normalized = String(email).toLowerCase().trim();

//     const user = await Registration.findOne({ email: normalized });
//     if (!user || !user.password) {
//       return res.status(401).json({ ok: false, message: "Invalid credentials" });
//     }

//     const isMatch = await bcrypt.compare(String(password), user.password);
//     if (!isMatch) {
//       return res.status(401).json({ ok: false, message: "Invalid credentials" });
//     }

//     const token = jwt.sign(
//       { id: user._id, email: user.email, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "3d" }
//     );

//     // ✅ PRODUCTION-READY COOKIE
//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: true,          // Vercel / HTTPS
//       sameSite: "None",      // Cross-domain
//       path: "/",             // 🔥 MUST
//       maxAge: 3 * 24 * 60 * 60 * 1000,
//     });

//     return res.status(200).json({
//       ok: true,
//       message: "Login successful",
//       user: {
//         id: user._id,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (err) {
//     console.error("loginUser error:", err);
//     return res.status(500).json({ ok: false, message: "Server error" });
//   }
// };

// exports.forgotPassword = [
//   body("email").isEmail().withMessage("Valid email required"),
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

//     try {
//       const { email } = req.body;
//       const normalized = String(email).toLowerCase().trim();
//       const user = await Registration.findOne({ email: normalized });
//       if (!user) return res.status(404).json({ message: "User not found" });

//       // rate-limit check
//       const last = await Verification.findOne({ email: normalized, purpose: "forgot" }).sort({ createdAt: -1 });
//       const RATE_LIMIT_SECONDS = parseInt(process.env.OTP_RATE_LIMIT_SECONDS || "60", 10);
//       if (last && (Date.now() - last.createdAt.getTime()) / 1000 < RATE_LIMIT_SECONDS) {
//         return res.status(429).json({ message: `Please wait before requesting a new OTP.` });
//       }

//       const otp = generateNumericOtp(6);
//       const otpHash = hashOtp(otp);
//       const otpToken = uuidv4();
//       const OTP_TTL_MS = parseInt(process.env.OTP_TTL_MS || String(10 * 60 * 1000), 10);
//       const expiresAt = new Date(Date.now() + OTP_TTL_MS);

//       await Verification.create({
//         email: normalized,
//         otpHash,
//         otpToken,
//         purpose: "forgot",
//         expiresAt,
//         attempts: 0,
//         verified: false,
//       });

//       // send OTP email (async)
//       (async () => {
//         try {
//           await transporter.sendMail({
//             from: EMAIL_FROM,
//             to: normalized,
//             subject: "Saraswati Classes - Password Reset OTP",
//             html: `
//               <div style="font-family: Arial, sans-serif; text-align:center; padding:20px;">
//                 <h3>Saraswati Classes</h3>
//                 <p>Your OTP is valid for ${Math.floor(OTP_TTL_MS/60000)} minutes</p>
//                 <div style="font-size:26px; font-weight:bold; padding:8px 14px; background:#0d6efd; color:#fff; border-radius:6px;">${otp}</div>
//                 <p style="font-size:12px; color:#666; margin-top:10px;">Do not share this OTP.</p>
//               </div>
//             `,
//           });
//           console.log("Forgot-password OTP queued for", normalized);
//         } catch (err) {
//           console.error("Forgot password email error:", err && err.message ? err.message : err);
//         }
//       })();

//       return res.status(200).json({ success: true, otpToken, resendAfter: RATE_LIMIT_SECONDS, message: "OTP sent to email" });
//     } catch (err) {
//       console.error("forgotPassword error:", err);
//       return res.status(500).json({ message: "Server error" });
//     }
//   },
// ];

// // exports.logout = (req, res) => {
// //   try {
// //     res.clearCookie("token", {
// //       httpOnly: true,
// //       sameSite: "lax",
// //       secure: false,
// //       path: "/",        // 🔥 MUST MATCH
// //     });

// //     return res.status(200).json({
// //       ok: true,
// //       message: "Logged out successfully",
// //     });
// //   } catch (err) {
// //     console.error("logout error:", err);
// //     return res.status(500).json({ ok: false, message: "Logout failed" });
// //   }
// // };

// exports.logout = (req, res) => {
//   try {
//     res.clearCookie("token", {
//       httpOnly: true,
//       secure: true,        // ⭐ MUST MATCH LOGIN
//       sameSite: "None",    // ⭐ MUST MATCH LOGIN
//       path: "/",           // ⭐ MUST MATCH LOGIN
//     });

//     return res.status(200).json({
//       ok: true,
//       message: "Logged out successfully",
//     });
//   } catch (err) {
//     console.error("logout error:", err);
//     return res.status(500).json({ ok: false, message: "Logout failed" });
//   }
// };


// exports.changePassword = async (req, res) => {
//   try {
//     const { oldPassword, newPassword } = req.body;

//     if (!oldPassword || !newPassword) {
//       return res.status(400).json({ error: "Missing fields" });
//     }

//     // 🔐 Logged-in user (from JWT middleware)
//     const user = await Registration.findById(req.user._id);

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // 🔍 Old password check
//     const isMatch = await bcrypt.compare(oldPassword, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ error: "Old password is incorrect" });
//     }

//     // 🔒 Hash new password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(newPassword, salt);

//     user.password = hashedPassword;
//     await user.save();

//     return res.json({ ok: true, message: "Password changed successfully" });
//   } catch (err) {
//     console.error("Change password error:", err);
//     return res.status(500).json({ error: "Server error" });
//   }
// };

// exports.verifyDeleteOtp = async (req, res) => {
//   try {
//     const { otp } = req.body;
//     const user = await Registration.findById(req.user._id);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const record = await Verification.findOne({
//       email: user.email,
//       purpose: "delete",
//       verified: false,
//     }).sort({ createdAt: -1 });

//     if (!record) {
//       return res.status(400).json({ message: "OTP not found" });
//     }

//     if (record.expiresAt < new Date()) {
//       return res.status(400).json({ message: "OTP expired" });
//     }

//     const providedHash = hashOtp(String(otp).trim());

//     if (providedHash !== record.otpHash) {
//       return res.status(400).json({ message: "Invalid OTP" });
//     }

//     // OTP verified
//     record.verified = true;
//     await record.save();

//     const email = user.email;

//     // 🔥 delete all user data
//     await Transaction.deleteMany({ email });
//     await Balance.deleteMany({ email });
//     await Stock.deleteMany({ email });
//     await Registration.deleteOne({ _id: user._id });
//     await Verification.deleteMany({ email, purpose: "delete" });

//     res.clearCookie("token", { path: "/", sameSite: "lax" });

//     return res.json({ ok: true, message: "Account deleted successfully" });
//   } catch (err) {
//     console.error("verifyDeleteOtp error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// exports.sendDeleteOtp = async (req, res) => {
//   try {
//     const user = await Registration.findById(req.user._id);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const otp = generateNumericOtp(6);
//     const otpHash = hashOtp(otp);

//     await Verification.create({
//       email: user.email,
//       otpHash,
//       purpose: "delete",
//       expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
//       attempts: 0,
//       verified: false,
//     });

//     await transporter.sendMail({
//       to: user.email,
//       subject: "Delete Account OTP",
//       text: `Your OTP is ${otp}. Valid for 5 minutes.`,
//     });

//     return res.json({ ok: true, message: "OTP sent" });
//   } catch (err) {
//     console.error("sendDeleteOtp error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };
// controllers/authController.js

// const Registration = require("../models/Registration");
// const Verification = require("../models/Verification");
// const Transaction = require("../models/Transaction");
// const Balance = require("../models/Balance");
// const Stock = require("../models/Stock");

// const bcrypt = require("bcrypt");
// const crypto = require("crypto");
// const jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer");
// const { body } = require("express-validator");
// const { v4: uuidv4 } = require("uuid");

// /* ======================================================
//    BREVO SMTP (RENDER SAFE)
// ====================================================== */
// const transporter = nodemailer.createTransport({
//   host: process.env.BREVO_SMTP_HOST,       // smtp-relay.brevo.com
//   port: Number(process.env.BREVO_SMTP_PORT), // 587
//   secure: false,                           // ❗ MUST false
//   auth: {
//     user: process.env.BREVO_SMTP_USER,     // xxx@smtp-brevo.com
//     pass: process.env.BREVO_SMTP_PASS,     // SMTP KEY
//   },
// });

// const EMAIL_FROM = process.env.EMAIL_FROM;

// // Verify once (non-blocking)
// transporter.verify()
//   .then(() => console.log("✅ Brevo SMTP connected"))
//   .catch(err => console.error("❌ Brevo SMTP error:", err.message));

// /* ======================================================
//    HELPERS
// ====================================================== */
// const generateOtp = () =>
//   Math.floor(100000 + Math.random() * 900000).toString();

// const hashOtp = (otp) =>
//   crypto.createHash("sha256").update(String(otp)).digest("hex");

// /* ======================================================
//    STEP 1: CHECK EMAIL + SEND OTP
// ====================================================== */
// exports.checkEmail = [
//   body("email").isEmail(),
//   async (req, res) => {
//     try {
//       const { email } = req.body;
//       const normalized = email.toLowerCase().trim();

//       const exists = await Registration.findOne({ email: normalized });
//       if (exists) {
//         return res.json({ exists: true, message: "Email already registered" });
//       }

//       const otp = generateOtp();
//       const otpHash = hashOtp(otp);
//       const otpToken = uuidv4();

//       await Verification.create({
//         email: normalized,
//         otpHash,
//         otpToken,
//         purpose: "register",
//         expiresAt: new Date(Date.now() + 10 * 60 * 1000),
//         attempts: 0,
//         verified: false,
//       });

//       await sendEmail({
//         to: normalized,
//         subject: "Saraswati Classes - OTP Verification",
//         html: `
//           <div style="font-family:Arial;text-align:center">
//             <h2>Saraswati Classes</h2>
//             <p>Your OTP (valid for 10 minutes)</p>
//             <h1 style="letter-spacing:5px">${otp}</h1>
//             <p>Do not share this OTP.</p>
//           </div>
//         `,
//       });

//       res.json({
//         exists: false,
//         otpToken,
//         message: "OTP sent successfully",
//       });
//     } catch (err) {
//       console.error("checkEmail:", err.message);
//       res.status(500).json({ message: "Server error" });
//     }
//   },
// ];

// /* ======================================================
//    STEP 2: VERIFY OTP
// ====================================================== */
// exports.verifyOtp = [
//   body("email").isEmail(),
//   body("otp").isLength({ min: 6, max: 6 }),
//   async (req, res) => {
//     try {
//       const { email, otp, otpToken } = req.body;
//       const normalized = email.toLowerCase().trim();

//       const record = await Verification.findOne({
//         email: normalized,
//         otpToken,
//       });

//       if (!record) return res.status(400).json({ message: "Invalid OTP" });
//       if (record.expiresAt < new Date())
//         return res.status(400).json({ message: "OTP expired" });

//       record.attempts++;
//       if (record.attempts > 5) {
//         await record.save();
//         return res.status(429).json({ message: "Too many attempts" });
//       }

//       if (hashOtp(otp) !== record.otpHash) {
//         await record.save();
//         return res.status(400).json({ message: "Invalid OTP" });
//       }

//       record.verified = true;
//       await record.save();

//       res.json({ success: true, message: "OTP verified" });
//     } catch (err) {
//       console.error("verifyOtp:", err.message);
//       res.status(500).json({ message: "Server error" });
//     }
//   },
// ];

// exports.registerUser = [
//   body("username").notEmpty(),
//   body("email").isEmail(),
//   body("password").isLength({ min: 6 }),
//   body("otpToken").notEmpty(),
//   async (req, res) => {
//     try {
//       let { username, email, password, otpToken } = req.body;
//       email = email.toLowerCase().trim();

//       const verified = await Verification.findOne({
//         email,
//         otpToken,
//         verified: true,
//         purpose: "register",
//       });

//       if (!verified)
//         return res.status(400).json({ message: "Email not verified" });

//       const hashed = await bcrypt.hash(password, 10);

//       const user = await Registration.create({
//         username,
//         email,
//         password: hashed,
//         role: "user",
//       });

//       await Verification.deleteMany({ email });

//       res.status(201).json({
//         message: "Registration successful",
//         user: { id: user._id, email: user.email },
//       });
//     } catch (err) {
//       console.error("registerUser:", err.message);
//       res.status(500).json({ message: "Server error" });
//     }
//   },
// ];
// /* ======================================================
//    LOGIN
// ====================================================== */
// exports.loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const normalized = email.toLowerCase().trim();

//     const user = await Registration.findOne({ email: normalized });
//     if (!user) return res.status(401).json({ message: "Invalid credentials" });

//     const ok = await bcrypt.compare(password, user.password);
//     if (!ok) return res.status(401).json({ message: "Invalid credentials" });

//     const token = jwt.sign(
//       { id: user._id, email: user.email, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "3d" }
//     );

//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "None",
//       path: "/",
//       maxAge: 3 * 24 * 60 * 60 * 1000,
//     });

//     res.json({ ok: true, message: "Login successful" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// /* ======================================================
//    LOGOUT
// ====================================================== */
// exports.logout = (req, res) => {
//   res.clearCookie("token", {
//     httpOnly: true,
//     secure: true,
//     sameSite: "None",
//     path: "/",
//   });
//   res.json({ ok: true, message: "Logged out successfully" });
// };

// /* ======================================================
//    FORGOT PASSWORD (SEND OTP)
// ====================================================== */
// exports.forgotPassword = async (req, res) => {
//   try {
//     const email = req.body.email.toLowerCase().trim();

//     const user = await Registration.findOne({ email });
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const otp = generateOtp();
//     const otpHash = hashOtp(otp);
//     const otpToken = uuidv4();

//     await Verification.create({
//       email,
//       otpHash,
//       otpToken,
//       purpose: "forgot",
//       expiresAt: new Date(Date.now() + 10 * 60 * 1000),
//       attempts: 0,
//       verified: false,
//     });

//     await transporter.sendMail({
//       from: EMAIL_FROM,
//       to: email,
//       subject: "Password Reset OTP",
//       html: `<h2>Your OTP: ${otp}</h2>`,
//     });

//     res.json({ success: true, otpToken });
//   } catch (err) {
//     console.error("forgotPassword:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Registration = require("../models/Registration");

/* =====================================================
   🔍 CHECK EMAIL
===================================================== */
exports.checkEmail = [
  body("email").isEmail().withMessage("Invalid email"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ exists: false });
    }

    try {
      const email = req.body.email.toLowerCase().trim();
      const user = await Registration.findOne({ email });
      res.json({ exists: !!user });
    } catch (err) {
      console.error("checkEmail:", err);
      res.status(500).json({ exists: false });
    }
  },
];

/* =====================================================
   🧾 REGISTER USER (NO OTP)
===================================================== */
exports.registerUser = [
  body("username").notEmpty().withMessage("Username required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let { username, email, password } = req.body;
      email = email.toLowerCase().trim();

      const existing = await Registration.findOne({ email });
      if (existing) {
        return res
          .status(400)
          .json({ message: "Email already registered" });
      }

      const hashed = await bcrypt.hash(password, 10);

      const user = await Registration.create({
        username,
        email,
        password: hashed,
        role: "user",
        emailVerified: true,
      });

      res.status(201).json({
        ok: true,
        message: "Registration successful",
        user: { id: user._id, email: user.email },
      });
    } catch (err) {
      console.error("registerUser:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
];

/* =====================================================
   🔐 LOGIN
===================================================== */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalized = email.toLowerCase().trim();

    const user = await Registration.findOne({ email: normalized });
    if (!user)
      return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    res.json({ ok: true, message: "Login successful" });
  } catch (err) {
    console.error("loginUser:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   🚪 LOGOUT
===================================================== */
exports.logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
  });
  res.json({ ok: true, message: "Logged out successfully" });
};



exports.saveFirebaseUser = async (req, res) => {
  try {
    let { email, username, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false });
    }

    email = email.toLowerCase().trim();

    let user = await Registration.findOne({ email });

    if (!user) {
      const hashed = await bcrypt.hash(password, 10);

      await Registration.create({
        username: username || "User",
        email,
        password: hashed,      // ✅ satisfies schema
        role: "user",
        emailVerified: true,
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("saveFirebaseUser:", err);
    console.log("firebase-save body:", req.body);

    return res.status(500).json({ ok: false });
  }
};