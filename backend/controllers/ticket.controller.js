const Ticket = require("../models/Ticket");
const Order = require("../models/Order");
const User = require("../models/User");
const generateCode = require("../util/generateCode.util");
const { isUnderWarranty } = require("../util/warranty.util");

const OUT_OF_WARRANTY_CHARGE = 500; // flat parts + labour charge

const OUT_OF_WARRANTY_CHARGE = 500; // flat parts + labour charge

// true if any item on the order is still inside its warranty period
const checkUnderWarranty = (order) => {
  if (!order.installedAt) return false;

  return order.items.some((item) => {
    const warrantyEnd = new Date(order.installedAt);
    warrantyEnd.setFullYear(warrantyEnd.getFullYear() + item.product.warrantyYears);
    return warrantyEnd > new Date();
  });
};

// POST /api/v1/tickets/public   body: { phone, orderCode, issue }   (no login)
exports.createTicket = async (req, res) => {
  try {
    const { phone, orderCode, issue } = req.body;

    if (!phone || !orderCode || !issue) {
      return res.status(400).json({
        success: false,
        message: "Phone, order code and issue are required",
      });
    }

    const order = await Order.findOne({ code: orderCode.toUpperCase() })
      .populate("customer")
      .populate("items.product", "warrantyYears");

    // order must exist AND belong to this phone number
    if (!order || order.customer.phone !== phone) {
      return res.status(404).json({
        success: false,
        message: "No order found for this phone and order code",
      });
    }

    if (order.status !== "installed") {
      return res.status(400).json({
        success: false,
        message: "Complaints can be raised only after installation",
      });
    }

    // check warranty automatically so the bill amount is decided up front
    const underWarranty = checkUnderWarranty(order);

    const ticket = await Ticket.create({
      code: await generateCode(Ticket, "TK"),
      customer: order.customer._id,
      order: order._id,
      issue,
      underWarranty,
      billAmount: underWarranty ? 0 : OUT_OF_WARRANTY_CHARGE,
    });

    return res.status(201).json({
      success: true,
      message: `Complaint registered. Your ticket number is ${ticket.code}`,
      data: ticket,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not create complaint",
      error: error.message,
    });
  }
};

// GET /api/v1/tickets?status=open   (staff; technician sees only their own)
exports.getTickets = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    if (req.user.role === "technician") {
      filter.assignedTo = req.user.id;
    }

    const tickets = await Ticket.find(filter)
      .populate("customer", "code name phone address")
      .populate("order", "code installedAt")
      .populate("assignedTo", "name phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Tickets fetched",
      data: tickets,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch tickets",
      error: error.message,
    });
  }
};

// PATCH /api/v1/tickets/:id
// sales assigns:      { "assignedTo": "<technician _id>" }
// technician closes:  { "status": "resolved" }
exports.updateTicket = async (req, res) => {
  try {
    const { assignedTo, status } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // assign a technician
    if (assignedTo) {
      const technician = await User.findById(assignedTo);

      if (!technician || technician.role !== "technician") {
        return res.status(400).json({
          success: false,
          message: "Assigned user must be a technician",
        });
      }

      ticket.assignedTo = assignedTo;
      ticket.status = "assigned";
    }

    // change status (e.g. resolved)
    if (status) {
      ticket.status = status;
    }

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Ticket updated",
      data: ticket,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not update ticket",
      error: error.message,
    });
  }
};

// POST /api/v1/tickets/confirm   body: { phone, code }   (public, no login)
// customer confirms the repair actually works, closing the ticket
exports.confirmTicket = async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: "Phone and ticket code are required",
      });
    }

    const ticket = await Ticket.findOne({ code: code.toUpperCase() }).populate("customer");

    if (!ticket || ticket.customer.phone !== phone) {
      return res.status(404).json({
        success: false,
        message: "No ticket found for this phone and ticket code",
      });
    }

    if (ticket.status !== "resolved") {
      return res.status(400).json({
        success: false,
        message: "Ticket can be confirmed only after it is resolved",
      });
    }

    ticket.status = "confirmed";
    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Thanks for confirming, your ticket is now closed",
      data: ticket,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not confirm ticket",
      error: error.message,
    });
  }
};