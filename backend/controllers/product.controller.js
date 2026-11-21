const Product = require("../models/Product");

// POST /api/v1/products
exports.createProduct = async (req, res) => {
  try {
    const { name, category, costPrice, sellPrice, stock, minStock, warrantyYears } = req.body;

    if (!name || !category || costPrice == null || sellPrice == null) {
      return res.status(400).json({
        success: false,
        message: "Name, category, cost price and sell price are required",
      });
    }

    const product = await Product.create({
      name,
      category,
      costPrice,
      sellPrice,
      stock,
      minStock,
      warrantyYears,
    });

    return res.status(201).json({
      success: true,
      message: "Product created",
      data: product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not create product",
      error: error.message,
    });
  }
};

// GET /api/v1/products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ category: 1, name: 1 });

    return res.status(200).json({
      success: true,
      message: "Products fetched",
      data: products,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch products",
      error: error.message,
    });
  }
};

// GET /api/v1/products/low-stock   (stock less than minStock)
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find();

    const lowStock = products.filter((p) => p.stock < p.minStock);

    return res.status(200).json({
      success: true,
      message: "Low-stock products fetched",
      data: lowStock,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch low-stock products",
      error: error.message,
    });
  }
};

// PUT /api/v1/products/:id   (edit details)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated",
      data: product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not update product",
      error: error.message,
    });
  }
};

// PATCH /api/v1/products/:id/stock   body: { "quantity": 20 }
exports.addStock = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.stock = product.stock + Number(quantity);
    await product.save();

    return res.status(200).json({
      success: true,
      message: `Added ${quantity} to stock`,
      data: product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not update stock",
      error: error.message,
    });
  }
};