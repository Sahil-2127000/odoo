const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // TK-1001
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    serialNo: { type: String },  // which panel/inverter has the problem
    issue: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // technician
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);