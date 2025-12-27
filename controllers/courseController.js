// controllers/courseController.js
const Course = require("../models/Course");

/* ================= ADD COURSE ================= */
exports.addCourse = async (req, res) => {
  try {
    console.log("📩 Incoming Body:", req.body);
    console.log("📸 Incoming File:", req.file);

    // Image validation
    if (!req.file) {
      return res.status(400).json({ error: "No thumbnail uploaded!" });
    }

    const {
      title,
      price,
      category,
      duration,
      instructor,
      description,
    } = req.body;

    // Required fields validation
    if (!title || !price || !category || !duration || !instructor) {
      return res.status(400).json({ error: "All required fields missing!" });
    }

    const course = new Course({
      title,
      price,
      category,
      duration,
      instructor,
      description,
      thumbnail: `/uploads/${req.file.filename}`, // IMPORTANT
    });

    await course.save();

    res.status(201).json(course);
  } catch (err) {
    console.error("❌ Backend Error (Add Course):", err);
    res.status(500).json({ error: "Server error while adding course" });
  }
};

/* ================= GET ALL COURSES ================= */
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    console.error("❌ Fetch Courses Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET COURSE BY ID ================= */
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json(course);
  } catch (err) {
    console.error("❌ Get Course Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE COURSE ================= */
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      price,
      category,
      duration,
      instructor,
      description,
    } = req.body;

    const updateData = {
      title,
      price,
      category,
      duration,
      instructor,
      description,
    };

    if (req.file) {
      updateData.thumbnail = `/uploads/${req.file.filename}`;
    }

    const course = await Course.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({ message: "✅ Course updated successfully", course });
  } catch (err) {
    console.error("❌ Update Course Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE COURSE ================= */
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({ message: "✅ Course deleted successfully" });
  } catch (err) {
    console.error("❌ Delete Course Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
