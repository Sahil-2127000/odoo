const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // TK-1001
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    issue: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "assigned", "resolved", "confirmed"],
      default: "open",
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // technician
    underWarranty: { type: Boolean, default: false }, // checked automatically at creation
    billAmount: { type: Number, default: 0 },          // 0 if under warranty, flat charge otherwise
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);