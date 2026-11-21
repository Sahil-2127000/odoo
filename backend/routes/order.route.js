const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  addPayment,
  trackOrder,
  getWarranties,
  scheduleInstallation,
} = require("../controllers/order.controller");

const { auth, isCustomerCare, isStaff } = require("../middlewares/auth.middleware");

// public (landing page)
router.get("/track", trackOrder);

// staff (fixed paths before "/:id" so they don't get swallowed by it)
router.post("/", auth, isCustomerCare, createOrder);
router.get("/", auth, isStaff, getOrders);
router.get("/warranties", auth, isStaff, getWarranties);
router.get("/:id", auth, isStaff, getOrderById);
router.patch("/:id/status", auth, isStaff, updateOrderStatus);
router.patch("/:id/payment", auth, isCustomerCare, addPayment);
router.patch("/:id/schedule", auth, isStaff, scheduleInstallation);

module.exports = router;