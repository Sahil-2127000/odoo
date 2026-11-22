// Customer portal: a logged-in customer sees only their own enquiries, orders,
// warranty and complaints. Their login (User) is linked to their Customer record.
const User = require("../models/User");
const Enquiry = require("../models/Enquiry");
const Order = require("../models/Order");
const Ticket = require("../models/Ticket");
const { itemWarrantyEnd } = require("../util/warranty.util");
const { openTicket } = require("../util/ticket.util");

// the Customer _id behind the logged-in user (null until sales converts their enquiry)
const myCustomerId = async (req) => (await User.findById(req.user.id)).customer;

// GET /api/v1/portal/summary   -> { enquiries, orders, tickets }
exports.getSummary = async (req, res) => {
  try {
    const customerId = await myCustomerId(req);

    // enquiries are matched by email, so they show even before the customer record exists
    const enquiries = await Enquiry.find({ email: req.user.email })
      .populate("surveyTechnician", "name")
      .sort({ createdAt: -1 });

    let orders = [];
    let tickets = [];
    if (customerId) {
      const found = await Order.find({ customer: customerId })
        .populate("items.product", "name category warrantyYears")
        .populate("assignedTechnician", "name phone")
        .sort({ createdAt: -1 });

      // add the warranty end date to every item (empty until installed)
      orders = found.map((order) => ({
        ...order.toObject(),
        items: order.items.map((item) => ({
          ...item.toObject(),
          warrantyEnd: itemWarrantyEnd(order, item),
        })),
      }));

      tickets = await Ticket.find({ customer: customerId })
        .populate("order", "code")
        .populate("assignedTo", "name")
        .sort({ createdAt: -1 });
    }

    return res.status(200).json({
      success: true,
      message: "Portal data fetched",
      data: { enquiries, orders, tickets },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not load your account",
      error: error.message,
    });
  }
};

// GET /api/v1/portal/orders/:id   (one of my orders, for the invoice)
exports.getMyOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: await myCustomerId(req) })
      .populate("customer")
      .populate("items.product", "name category warrantyYears");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order fetched",
      data: order,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch order",
      error: error.message,
    });
  }
};

// POST /api/v1/portal/tickets   body: { orderId, issue }
exports.raiseTicket = async (req, res) => {
  try {
    const { orderId, issue } = req.body;

    if (!orderId || !issue) {
      return res.status(400).json({
        success: false,
        message: "Order and issue are required",
      });
    }

    const order = await Order.findOne({ _id: orderId, customer: await myCustomerId(req) }).populate(
      "items.product",
      "warrantyYears"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "installed") {
      return res.status(400).json({
        success: false,
        message: "Complaints can be raised only after installation",
      });
    }

    const ticket = await openTicket(order, issue);

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

// PATCH /api/v1/portal/tickets/:id/confirm   (the repair works -> close the ticket)
exports.confirmMyTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, customer: await myCustomerId(req) });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
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
