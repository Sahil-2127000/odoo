const crypto = require("crypto");
const { instance } = require("../config/razorpay.config");
const Order = require("../models/Order");

// POST /api/v1/payments/create-order   (public)
// body: { phone, orderCode, amount }
exports.createPaymentOrder = async (req, res) => {
  try {
    const { phone, orderCode } = req.body;
    const amount = Number(req.body.amount);

    if (!phone || !orderCode || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Phone, order code and a valid amount are required",
      });
    }

    const order = await Order.findOne({ code: orderCode.toUpperCase() }).populate("customer");

    // order must exist AND belong to this phone
    if (!order || order.customer.phone !== phone) {
      return res.status(404).json({
        success: false,
        message: "No order found for this phone and order code",
      });
    }

    if (order.status === "quoted") {
      return res.status(400).json({
        success: false,
        message: "Payment can be made after the quote is confirmed",
      });
    }

    const pending = order.total - order.amountPaid;
    if (amount > pending) {
      return res.status(400).json({
        success: false,
        message: `Amount is more than pending balance (₹${pending})`,
      });
    }

    // Razorpay works in paise (₹1 = 100 paise)
    const razorpayOrder = await instance.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: order.code,
      notes: { orderId: order._id.toString() },
    });

    return res.status(200).json({
      success: true,
      message: "Payment order created",
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount, // in paise
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY, // frontend needs the public key
        orderCode: order.code,
        customerName: order.customer.name,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not create payment order",
      error: error.message,
    });
  }
};

// POST /api/v1/payments/verify   (public)
// body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment details are missing",
      });
    }

    // 1. check the signature: proves the payment really came from Razorpay
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // 2. get the real amount + our order id from Razorpay (not from the browser)
    const razorpayOrder = await instance.orders.fetch(razorpay_order_id);
    const amount = razorpayOrder.amount / 100; // paise → rupees

    const order = await Order.findById(razorpayOrder.notes.orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 3. add the payment to the order
    order.amountPaid = order.amountPaid + amount;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment successful",
      data: {
        orderCode: order.code,
        paid: amount,
        pending: order.total - order.amountPaid,
        paymentId: razorpay_payment_id,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not verify payment",
      error: error.message,
    });
  }
};