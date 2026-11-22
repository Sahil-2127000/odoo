const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // EN-1001
    name: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String },
    systemType: { type: String, enum: ["on_grid", "off_grid"] }, // what the customer asked for
    capacityKw: { type: Number },                                 // 1 to 5
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
    surveyNotes: { type: String }, // anything else the technician noticed on the roof
    // site survey: sales picks the technician + date, the technician fills the measurements
    surveyTechnician: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    surveyDate: { type: Date },
    surveyDirection: { type: String }, // roof faces e.g. "South"
    surveyTilt: { type: Number },      // degrees
    surveyCableMeters: { type: Number }, // cable needed from roof to inverter, used in the quote
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enquiry", enquirySchema);