const express = require("express");
const router = express.Router();

const { getAdminDashboard } = require("../controllers/dashboard.controller");
const { auth, isAdmin } = require("../middlewares/auth.middleware");

router.get("/admin", auth, isAdmin, getAdminDashboard);

module.exports = router;