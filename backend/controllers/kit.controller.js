const Kit = require("../models/Kit");
const Product = require("../models/Product");

// POST /api/v1/kits
// body: { "name": "5 kW On-Grid Kit", "systemType": "on_grid", "capacityKw": 5,
//         "items": [ { "product": "<id>", "qty": 10 }, ... ] }
exports.createKit = async (req, res) => {
  try {
    const { name, items, systemType, capacityKw } = req.body;

    if (!name || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Kit name and at least one item are required",
      });
    }

    // calculate kit price from product sell prices
    let price = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }

      price = price + product.sellPrice * item.qty;
    }

    const kit = await Kit.create({ name, systemType, capacityKw, items, price });

    return res.status(201).json({
      success: true,
      message: "Kit created",
      data: kit,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not create kit",
      error: error.message,
    });
  }
};

// GET /api/v1/kits   (with product details)
exports.getKits = async (req, res) => {
  try {
    const kits = await Kit.find()
      .populate("items.product", "name category sellPrice")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Kits fetched",
      data: kits,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch kits",
      error: error.message,
    });
  }
};

// DELETE /api/v1/kits/:id
exports.deleteKit = async (req, res) => {
  try {
    const kit = await Kit.findByIdAndDelete(req.params.id);

    if (!kit) {
      return res.status(404).json({
        success: false,
        message: "Kit not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Kit deleted",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not delete kit",
      error: error.message,
    });
  }
};