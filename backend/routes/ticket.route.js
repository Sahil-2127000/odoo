const express = require("express");
const router = express.Router();

const { createTicket, getTickets, updateTicket } = require("../controllers/ticket.controller");
const { auth, isStaff } = require("../middlewares/auth.middleware");

// public: landing page complaint form
router.post("/public", createTicket);

// staff
router.get("/", auth, isStaff, getTickets);
router.patch("/:id", auth, isStaff, updateTicket);

module.exports = router;