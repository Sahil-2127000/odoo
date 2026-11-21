const Enquiry = require("../models/Enquiry");
const Customer = require("../models/Customer");
const generateCode = require("../util/generateCode.util");

// POST /api/v1/enquiries
exports.createEnquiry = async (req, res) => {
  try {
    
    const { name, phone, city, note } = req.body;

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

    const enquiries = await Enquiry.find(filter).sort({ createdAt: -1 });

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

    // create customer from the enquiry details
    const customer = await Customer.create({
      code: await generateCode(Customer, "CU"),
      name: enquiry.name,
      phone: enquiry.phone,
      email: req.body.email,
      address: req.body.address || enquiry.city,
    });

    enquiry.status = "converted";
    await enquiry.save();

    return res.status(201).json({
      success: true,
      message: "Enquiry converted to customer",
      data: customer,
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