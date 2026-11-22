const Enquiry = require("../models/Enquiry");
const Customer = require("../models/Customer");
const Kit = require("../models/Kit");
const User = require("../models/User");
const generateCode = require("../util/generateCode.util");
const { createQuoteFromKit } = require("../util/quote.util");

// POST /api/v1/enquiries
exports.createEnquiry = async (req, res) => {
  try {
    
    const { name, phone, city, note, systemType, capacityKw } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    const enquiry = await Enquiry.create({
      code: await generateCode(Enquiry, "EN"),
      name,
      phone,
      city,
      note,
      systemType,
      capacityKw,
    });

    return res.status(201).json({
      success: true,
      message: "Enquiry created",
      data: enquiry,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not create enquiry",
      error: error.message,
    });
  }
};

// GET /api/v1/enquiries?status=new
exports.getEnquiries = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const enquiries = await Enquiry.find(filter)
      .populate("surveyTechnician", "name phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Enquiries fetched",
      data: enquiries,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch enquiries",
      error: error.message,
    });
  }
};

// GET /api/v1/enquiries/follow-ups   (follow-ups due today or earlier)
exports.getTodayFollowUps = async (req, res) => {
  try {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const enquiries = await Enquiry.find({
      status: "follow_up",
      nextFollowUp: { $lte: endOfToday },
    }).sort({ nextFollowUp: 1 });

    return res.status(200).json({
      success: true,
      message: "Today's follow-ups fetched",
      data: enquiries,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch follow-ups",
      error: error.message,
    });
  }
};

// PUT /api/v1/enquiries/:id   (update status / note / nextFollowUp)
exports.updateEnquiry = async (req, res) => {
  try {
    const { status, note, nextFollowUp } = req.body;

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status, note, nextFollowUp },
      { new: true, runValidators: true }
    );

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Enquiry updated",
      data: enquiry,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not update enquiry",
      error: error.message,
    });
  }
};

// PATCH /api/v1/enquiries/:id/survey   body: { surveyStatus, surveyNotes }
// PATCH /api/v1/enquiries/:id/assign-survey   body: { surveyTechnician, surveyDate }   (sales)
exports.assignSurvey = async (req, res) => {
  try {
    const { surveyTechnician, surveyDate } = req.body;

    if (!surveyTechnician || !surveyDate) {
      return res.status(400).json({
        success: false,
        message: "Technician and survey date are required",
      });
    }

    const technician = await User.findById(surveyTechnician);
    if (!technician || technician.role !== "technician") {
      return res.status(400).json({
        success: false,
        message: "Assigned user must be a technician",
      });
    }

    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    if (enquiry.surveyStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "The survey for this enquiry is already done",
      });
    }

    enquiry.surveyTechnician = surveyTechnician;
    enquiry.surveyDate = surveyDate;
    await enquiry.save();
    await enquiry.populate("surveyTechnician", "name phone");

    return res.status(200).json({
      success: true,
      message: `Survey assigned to ${technician.name}`,
      data: enquiry,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not assign survey",
      error: error.message,
    });
  }
};

// GET /api/v1/enquiries/my-surveys   (technician: surveys assigned to me, still pending)
exports.getMySurveys = async (req, res) => {
  try {
    const surveys = await Enquiry.find({
      surveyTechnician: req.user.id,
      surveyStatus: "pending",
    }).sort({ surveyDate: 1 });

    return res.status(200).json({
      success: true,
      message: "Surveys fetched",
      data: surveys,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch surveys",
      error: error.message,
    });
  }
};

// PATCH /api/v1/enquiries/:id/survey   (technician records the result on site)
// body: { surveyStatus: "approved" | "rejected", surveyDirection, surveyTilt, surveyCableMeters, surveyNotes }
exports.updateSurvey = async (req, res) => {
  try {
    const { surveyStatus, surveyDirection, surveyTilt, surveyCableMeters, surveyNotes } = req.body;

    if (!["approved", "rejected"].includes(surveyStatus)) {
      return res.status(400).json({
        success: false,
        message: "surveyStatus must be approved or rejected",
      });
    }

    // the quote uses the cable length, so it is required when the site is approved
    if (surveyStatus === "approved" && !(Number(surveyCableMeters) > 0)) {
      return res.status(400).json({
        success: false,
        message: "Enter the cable length in metres to approve the site",
      });
    }

    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    // a technician can only record surveys assigned to them
    if (req.user.role === "technician" && String(enquiry.surveyTechnician) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "This survey is not assigned to you",
      });
    }

    enquiry.surveyStatus = surveyStatus;
    enquiry.surveyDirection = surveyDirection;
    enquiry.surveyTilt = surveyTilt;
    enquiry.surveyCableMeters = surveyCableMeters;
    if (surveyNotes !== undefined) enquiry.surveyNotes = surveyNotes;

    // survey rejected -> lead lost, same as the paper flow
    if (surveyStatus === "rejected") enquiry.status = "lost";

    await enquiry.save();

    return res.status(200).json({
      success: true,
      message: "Survey updated",
      data: enquiry,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not update survey",
      error: error.message,
    });
  }
};

// POST /api/v1/enquiries/:id/convert   (enquiry -> customer)
exports.convertEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    if (enquiry.status === "converted") {
      return res.status(400).json({
        success: false,
        message: "Enquiry is already converted",
      });
    }

    if (enquiry.surveyStatus !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Site survey must be approved before converting to a customer",
      });
    }

    // create customer from the enquiry details
    const customer = await Customer.create({
      code: await generateCode(Customer, "CU"),
      name: enquiry.name,
      phone: enquiry.phone,
      email: req.body.email,
      address: req.body.address || enquiry.city,
      enquiry: enquiry._id,
    });

    enquiry.status = "converted";
    await enquiry.save();

    // make the quote straight away from the kit the customer asked for,
    // with the cable length the technician measured
    let quote = null;
    const kit = await Kit.findOne({ systemType: enquiry.systemType, capacityKw: enquiry.capacityKw });
    if (kit) {
      quote = await createQuoteFromKit(customer._id, kit._id, enquiry.surveyCableMeters);
    }

    return res.status(201).json({
      success: true,
      message: quote
        ? `Enquiry converted to customer ${customer.code}. Quote ${quote.code} created from the ${kit.name}`
        : `Enquiry converted to customer ${customer.code}. No matching kit, create the quote from Orders`,
      data: { customer, quote },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not convert enquiry",
      error: error.message,
    });
  }
};