const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ["panel", "inverter", "battery", "cable", "other"], // cable is sold per metre
      required: true,
    },
    costPrice: { type: Number, required: true }, // what we pay
    sellPrice: { type: Number, required: true }, // what customer pays
    stock: { type: Number, default: 0 },
    minStock: { type: Number, default: 5 },      // low-stock alert below this
    warrantyYears: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);