const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // TK-1001
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    issue: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "assigned", "resolved"],
      default: "open",
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // technician
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);