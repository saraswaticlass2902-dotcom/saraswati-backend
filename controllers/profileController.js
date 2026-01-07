// const Profile = require("../models/Profile");

// // ===== GET PROFILE =====
// exports.getProfile = async (req, res) => {
//   try {
//     const profile = await Profile.findOne({ email: req.user.email });

//     if (!profile) {
//       return res.json({ exists: false });
//     }

//     return res.json({ exists: true, profile });
//   } catch (err) {
//     console.error("getProfile error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // ===== UPDATE PROFILE =====
// exports.updateProfile = async (req, res) => {
//   try {
//     const updated = await Profile.findOneAndUpdate(
//       { email: req.user.email },
//       req.body,
//       { upsert: true, new: true }
//     );

//     return res.json({ ok: true, profile: updated });
//   } catch (err) {
//     console.error("updateProfile error:", err);
//     return res.status(500).json({ message: "Update failed" });
//   }
// };


// exports.getProfileByEmail = async (req, res) => {
//   try {
//     const email = String(req.params.email).toLowerCase().trim();

//     const profile = await Profile.findOne({ email });
//     if (!profile) {
//       return res.json({ exists: false });
//     }

//     return res.status(200).json({
//       exists: true,
//       profile,
//     });
//   } catch (err) {
//     console.error("getProfileByEmail error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

const Profile = require("../models/Profile");
const cloudinary = require("cloudinary").v2;

exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false });
    }

    const photoUrl = req.file.path;          // Cloudinary URL
    const publicId = req.file.filename;      // Cloudinary public_id

    const existing = await Profile.findOne({ email: req.user.email });

    // 🗑 delete old image safely
    if (existing?.profilePhotoPublicId) {
      await cloudinary.uploader.destroy(
        existing.profilePhotoPublicId
      );
    }

    const updated = await Profile.findOneAndUpdate(
      { email: req.user.email },
      {
        profilePhoto: photoUrl,
        profilePhotoPublicId: publicId,
      },
      { upsert: true, new: true }
    );

    return res.json({
      ok: true,
      photo: photoUrl,
      profile: updated,
    });
  } catch (err) {
    console.error("uploadProfilePhoto error:", err);
    return res.status(500).json({ ok: false });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ email: req.user.email });

    if (!profile) {
      return res.json({ exists: false });
    }

    return res.json({ exists: true, profile });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE PROFILE ================= */
exports.updateProfile = async (req, res) => {
  try {
    const updated = await Profile.findOneAndUpdate(
      { email: req.user.email },
      req.body,
      { upsert: true, new: true }
    );

    return res.json({ ok: true, profile: updated });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ message: "Update failed" });
  }
};

/* ================= UPLOAD PROFILE PHOTO ================= */



/* ================= ADMIN VIEW PROFILE ================= */
exports.getProfileByEmail = async (req, res) => {
  try {
    const email = String(req.params.email).toLowerCase().trim();

    const profile = await Profile.findOne({ email });
    if (!profile) {
      return res.json({ exists: false });
    }

    return res.status(200).json({
      exists: true,
      profile,
    });
  } catch (err) {
    console.error("getProfileByEmail error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
