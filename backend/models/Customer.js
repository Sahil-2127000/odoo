const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // CU-1001
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);