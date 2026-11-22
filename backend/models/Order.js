const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // OR-1001
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    systemType: { type: String, enum: ["on_grid", "off_grid"] }, // copied from the kit
    capacityKw: { type: Number },                                 // copied from the kit
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
    serials: [{ type: String }],              // serial numbers scanned at dispatch
    scheduledDate: { type: Date },            // when the installation crew is booked
    assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    installedAt: { type: Date },              // warranty starts from this date
    installationPhoto: { type: String },      // Cloudinary URL of the installed panel
    status: {
      type: String,
      enum: ["quoted", "confirmed", "packed", "dispatched", "delivered", "installed"],
      default: "quoted",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);