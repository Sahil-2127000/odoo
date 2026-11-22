const mongoose = require("mongoose");

const kitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // "5 kW On-Grid Kit"
    systemType: {
      type: String,
      enum: ["on_grid", "off_grid"], // off-grid = on-grid parts + battery backup
      default: "on_grid",
    },
    capacityKw: { type: Number }, // 1 to 5
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