const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  getMe,
  logout,
  createStaff,
  getAllUsers,
  toggleUserStatus,
} = require("../controllers/auth.controller");

const { auth, isAdmin , isStaff } = require("../middlewares/auth.middleware");

// public
router.post("/signup", signup);
router.post("/login", login);

// logged-in user
router.get("/me", auth, getMe);
router.post("/logout", auth, logout);

// admin only
router.post("/staff", auth, isAdmin, createStaff);
// staff (sales needs it for ticket assignment, warehouse for installation scheduling)
router.get("/users", auth, isStaff, getAllUsers);
router.patch("/users/:id/status", auth, isAdmin, toggleUserStatus);

module.exports = router;