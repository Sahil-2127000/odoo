const express = require("express");
const router = express.Router();

const {
  createCustomer,
  getCustomers,
  getCustomerById,
} = require("../controllers/customer.controller");

const { auth, isCustomerCare } = require("../middlewares/auth.middleware");

router.post("/", auth, isCustomerCare, createCustomer);
router.get("/", auth, isCustomerCare, getCustomers);
router.get("/:id", auth, isCustomerCare, getCustomerById);

module.exports = router;