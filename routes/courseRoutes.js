const express = require("express");
const router = express.Router();

const uploadCourse = require("../middleware/uploadCourse");
const courseController = require("../controllers/courseController");
const adminAuth = require("../middleware/adminAuth"); // ✅ optional but recommended

// ✅ ADD COURSE (Cloudinary)
router.post(
  "/add",
  adminAuth,
  uploadCourse.single("thumbnail"),
  courseController.addCourse
);


// ✅ LIST COURSES
router.get("/list", courseController.getAllCourses);

// ✅ GET SINGLE COURSE
router.get("/:id", courseController.getCourseById);

// ✅ UPDATE COURSE (optional image replace)
router.put(
  "/:id",
  adminAuth,
  uploadCourse.single("thumbnail"),
  courseController.updateCourse
);

// ✅ DELETE COURSE
router.delete("/:id", adminAuth, courseController.deleteCourse);

module.exports = router;
