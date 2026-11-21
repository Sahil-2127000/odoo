const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // EN-1001
    name: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String },
    status: {
      type: String,
      enum: ["new", "follow_up", "converted", "lost"],
      default: "new",
    },
    note: { type: String },        // latest remark
    nextFollowUp: { type: Date },  // when to call again
    surveyStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"], // technician's site survey
      default: "pending",
    },
    surveyNotes: { type: String }, // roof direction, tilt, cable length etc.
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enquiry", enquirySchema);