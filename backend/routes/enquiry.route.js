const express = require("express");
const router = express.Router();

const {
  createEnquiry,
  getEnquiries,
  getTodayFollowUps,
  updateEnquiry,
  assignSurvey,
  getMySurveys,
  updateSurvey,
  convertEnquiry,
} = require("../controllers/enquiry.controller");

const { auth, isCustomerCare, isTechnician } = require("../middlewares/auth.middleware");

router.post("/public", createEnquiry);
router.post("/", auth, isCustomerCare, createEnquiry);
router.get("/", auth, isCustomerCare, getEnquiries);
router.get("/follow-ups", auth, isCustomerCare, getTodayFollowUps);
router.put("/:id", auth, isCustomerCare, updateEnquiry);
router.post("/:id/convert", auth, isCustomerCare, convertEnquiry);

// site survey: sales assigns a technician, the technician records the result
router.patch("/:id/assign-survey", auth, isCustomerCare, assignSurvey);
router.get("/my-surveys", auth, isTechnician, getMySurveys);
router.patch("/:id/survey", auth, isTechnician, updateSurvey);

module.exports = router;
