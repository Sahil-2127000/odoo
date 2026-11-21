const express = require("express");
const router = express.Router();

const { createPaymentOrder, verifyPayment } = require("../controllers/payments.controller");

// public: customer pays from the landing page "Track order" screen
router.post("/create-order", createPaymentOrder);
router.post("/verify", verifyPayment);

module.exports = router;