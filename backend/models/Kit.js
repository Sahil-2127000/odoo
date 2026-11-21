const mongoose = require("mongoose");

const kitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // "5 kW On-Grid Kit"
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        qty: { type: Number },
      },
    ],
    price: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Kit", kitSchema);