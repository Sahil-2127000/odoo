const express = require("express");
const router = express.Router();

const { getSummary, getMyOrder, raiseTicket, confirmMyTicket } = require("../controllers/portal.controller");
const { auth, isCustomer } = require("../middlewares/auth.middleware");

// customer portal (logged-in customers only, each sees only their own data)
router.get("/summary", auth, isCustomer, getSummary);
router.get("/orders/:id", auth, isCustomer, getMyOrder);
router.post("/tickets", auth, isCustomer, raiseTicket);
router.patch("/tickets/:id/confirm", auth, isCustomer, confirmMyTicket);

module.exports = router;
