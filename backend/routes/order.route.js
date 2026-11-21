const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  addPayment,
  trackOrder,
} = require("../controllers/order.controller");

const { auth, isCustomerCare, isStaff } = require("../middlewares/auth.middleware");

// public (landing page)
router.get("/track", trackOrder);

// staff
router.post("/", auth, isCustomerCare, createOrder);
router.get("/", auth, isStaff, getOrders);
router.get("/:id", auth, isStaff, getOrderById);
router.patch("/:id/status", auth, isStaff, updateOrderStatus);
router.patch("/:id/payment", auth, isCustomerCare, addPayment);

module.exports = router;