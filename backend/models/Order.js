const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // OR-1001
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        qty: { type: Number },
        price: { type: Number }, // sell price per unit
      },
    ],
    total: { type: Number, default: 0 },      // including 18% GST
    totalCost: { type: Number, default: 0 },  // profit = total - totalCost
    amountPaid: { type: Number, default: 0 }, // pending = total - amountPaid
    installedAt: { type: Date },              // warranty starts from this date
    status: {
      type: String,
      enum: ["quoted", "confirmed", "packed", "dispatched", "delivered", "installed"],
      default: "quoted",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);