const Profile = require("../models/Profile");

// ===== GET PROFILE =====
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

// ===== UPDATE PROFILE =====
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
