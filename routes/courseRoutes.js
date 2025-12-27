const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const courseController = require("../controllers/courseController");


router.post(
  "/add",
  upload.single("thumbnail"), // 👈 THIS IS CRITICAL
  courseController.addCourse
);
router.get("/list", courseController.getAllCourses);
router.get("/:id", courseController.getCourseById);
router.put("/:id", upload.single("thumbnail"), courseController.updateCourse);
router.delete("/:id", courseController.deleteCourse);

module.exports = router;
