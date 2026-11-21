const express = require("express");
const router = express.Router();

const {
  createEnquiry,
  getEnquiries,
  getTodayFollowUps,
  updateEnquiry,
  updateSurvey,
  convertEnquiry,
} = require("../controllers/enquiry.controller");

const { auth, isCustomerCare } = require("../middlewares/auth.middleware");

router.post("/public", createEnquiry);
router.post("/", auth, isCustomerCare, createEnquiry);
router.get("/", auth, isCustomerCare, getEnquiries);
router.get("/follow-ups", auth, isCustomerCare, getTodayFollowUps);
router.put("/:id", auth, isCustomerCare, updateEnquiry);
router.patch("/:id/survey", auth, isCustomerCare, updateSurvey);
router.post("/:id/convert", auth, isCustomerCare, convertEnquiry);

module.exports = router;