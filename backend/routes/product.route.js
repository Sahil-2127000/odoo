const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  getLowStockProducts,
  updateProduct,
  addStock,
} = require("../controllers/product.controller");

const { auth, isAdmin, isWarehouse, isStaff } = require("../middlewares/auth.middleware");

router.post("/", auth, isAdmin, createProduct);
router.get("/", auth, isStaff, getProducts);
router.get("/low-stock", auth, isWarehouse, getLowStockProducts);
router.put("/:id", auth, isAdmin, updateProduct);
router.patch("/:id/stock", auth, isWarehouse, addStock);

module.exports = router;