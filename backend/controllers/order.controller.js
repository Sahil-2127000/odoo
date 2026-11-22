const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const User = require("../models/User");
const { itemWarrantyEnd } = require("../util/warranty.util");
const { createQuoteFromKit } = require("../util/quote.util");
const { uploadPhoto } = require("../util/cloudinary.util");

const STATUS_FLOW = ["quoted", "confirmed", "packed", "dispatched", "delivered", "installed"];

// POST /api/v1/orders   body: { "customer": "<id>", "kit": "<id>" }
exports.createOrder = async (req, res) => {
  try {
    const { customer, kit } = req.body;

    if (!customer || !kit) {
      return res.status(400).json({
        success: false,
        message: "Customer and kit are required",
      });
    }

    // the customer's enquiry holds the cable length the technician measured (if any)
    const customerData = await Customer.findById(customer).populate("enquiry", "surveyCableMeters");
    if (!customerData) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // copy kit items into the order with today's prices
    const order = await createQuoteFromKit(customer, kit, customerData.enquiry?.surveyCableMeters);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Kit not found",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Quote created",
      data: order,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not create order",
      error: error.message,
    });
  }
};

// GET /api/v1/orders?status=quoted
exports.getOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const orders = await Order.find(filter)
      .populate("customer", "code name phone address")
      .populate("assignedTechnician", "name phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Orders fetched",
      data: orders,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch orders",
      error: error.message,
    });
  }
};

// GET /api/v1/orders/:id
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer")
      .populate("items.product", "name category warrantyYears")
      .populate("assignedTechnician", "name phone");

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

// PATCH /api/v1/orders/:id/status   body: { "status": "confirmed" }
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // only allow moving to the NEXT status (no skipping, no going back)
    const currentIndex = STATUS_FLOW.indexOf(order.status);
    const nextStatus = STATUS_FLOW[currentIndex + 1];

    if (status !== nextStatus) {
      return res.status(400).json({
        success: false,
        message: nextStatus
          ? `Order is "${order.status}", next status must be "${nextStatus}"`
          : "Order is already installed",
      });
    }

    // when packed, take the items out of stock
    if (status === "packed") {
      // first check every product has enough stock
      for (const item of order.items) {
        const product = await Product.findById(item.product);

        if (product.stock < item.qty) {
          return res.status(400).json({
            success: false,
            message: `Not enough stock for ${product.name} (have ${product.stock}, need ${item.qty})`,
          });
        }
      }

      // then reduce stock
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        product.stock = product.stock - item.qty;
        await product.save();
      }
    }

    // when dispatched, save the serial numbers scanned for this order
    if (status === "dispatched") {
      const { serials } = req.body;
      if (!Array.isArray(serials) || serials.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Scan at least one serial number to dispatch",
        });
      }
      order.serials = serials;
    }

    // when installed, technician must attach a photo of the installed panel
    if (status === "installed") {
      const { photo } = req.body;
      if (!photo) {
        return res.status(400).json({
          success: false,
          message: "A photo of the installed panel is required",
        });
      }
      order.installationPhoto = await uploadPhoto(photo);
      order.installedAt = new Date();
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order moved to ${status}`,
      data: order,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not update order status",
      error: error.message,
    });
  }
};

// PATCH /api/v1/orders/:id/payment   body: { "amount": 50000 }
exports.addPayment = async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const pending = order.total - order.amountPaid;
    if (amount > pending) {
      return res.status(400).json({
        success: false,
        message: `Amount is more than pending balance (₹${pending})`,
      });
    }

    order.amountPaid = order.amountPaid + amount;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment added",
      data: {
        order,
        pending: order.total - order.amountPaid,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not add payment",
      error: error.message,
    });
  }
};

// GET /api/v1/orders/warranties   (staff) — every installed order with warranty status per item
exports.getWarranties = async (req, res) => {
  try {
    const orders = await Order.find({ status: "installed" })
      .populate("customer", "code name phone")
      .populate("items.product", "name warrantyYears")
      .sort({ installedAt: -1 });

    const warranties = orders.map((order) => ({
      orderCode: order.code,
      customer: order.customer,
      installedAt: order.installedAt,
      items: order.items.map((item) => {
        const warrantyEnd = itemWarrantyEnd(order, item);
        return {
          name: item.product.name,
          warrantyYears: item.product.warrantyYears,
          warrantyEnd,
          status: warrantyEnd > new Date() ? "active" : "expired",
        };
      }),
    }));

    return res.status(200).json({
      success: true,
      message: "Warranties fetched",
      data: warranties,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch warranties",
      error: error.message,
    });
  }
};

// PATCH /api/v1/orders/:id/schedule   body: { scheduledDate, assignedTechnician }
// order must be "delivered" (installation not done yet)
exports.scheduleInstallation = async (req, res) => {
  try {
    const { scheduledDate, assignedTechnician } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Installation can only be scheduled once the order is delivered",
      });
    }

    if (assignedTechnician) {
      const technician = await User.findById(assignedTechnician);
      if (!technician || technician.role !== "technician") {
        return res.status(400).json({
          success: false,
          message: "Assigned user must be a technician",
        });
      }
      order.assignedTechnician = assignedTechnician;
    }

    if (scheduledDate) order.scheduledDate = scheduledDate;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Installation scheduled",
      data: order,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not schedule installation",
      error: error.message,
    });
  }
};

// GET /api/v1/orders/track?phone=9815488213&code=OR-1001   (public, no login)
exports.trackOrder = async (req, res) => {
  try {
    const { phone, code } = req.query;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: "Phone and order code are required",
      });
    }

    const order = await Order.findOne({ code: code.toUpperCase() })
      .populate("customer", "name phone")
      .populate("items.product", "name warrantyYears");

    // order must exist AND belong to this phone number
    if (!order || order.customer.phone !== phone) {
      return res.status(404).json({
        success: false,
        message: "No order found for this phone and order code",
      });
    }

    // warranty end = installed date + product warranty years
    const items = order.items.map((item) => ({
      name: item.product.name,
      qty: item.qty,
      warrantyYears: item.product.warrantyYears,
      warrantyEnd: itemWarrantyEnd(order, item),
    }));

    return res.status(200).json({
      success: true,
      message: "Order found",
      data: {
        code: order.code,
        customerName: order.customer.name,
        status: order.status,
        systemType: order.systemType,
        capacityKw: order.capacityKw,
        total: order.total,
        amountPaid: order.amountPaid, // pending = total - amountPaid (for "Pay now")
        installedAt: order.installedAt,
        items,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not track order",
      error: error.message,
    });
  }
};