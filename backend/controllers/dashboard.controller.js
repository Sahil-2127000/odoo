const Order = require("../models/Order");
const Enquiry = require("../models/Enquiry");
const Ticket = require("../models/Ticket");
const Product = require("../models/Product");

// GET /api/v1/dashboard/admin
exports.getAdminDashboard = async (req, res) => {
  try {
    // quotes are not real sales yet, so skip "quoted" orders
    const orders = await Order.find({ status: { $ne: "quoted" } });

    // date boundaries
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 6); // last 7 days
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalRevenue = 0;
    let todayRevenue = 0;
    let weekRevenue = 0;
    let monthRevenue = 0;
    let collected = 0;
    let totalCost = 0;

    for (const order of orders) {
      totalRevenue += order.total;
      collected += order.amountPaid;
      totalCost += order.totalCost;

      if (order.createdAt >= startOfToday) todayRevenue += order.total;
      if (order.createdAt >= startOfWeek) weekRevenue += order.total;
      if (order.createdAt >= startOfMonth) monthRevenue += order.total;
    }

    // counts
    const newEnquiries = await Enquiry.countDocuments({ status: "new" });
    const pendingQuotes = await Order.countDocuments({ status: "quoted" });
    const unfinishedInstalls = await Order.countDocuments({
      status: { $in: ["confirmed", "packed", "dispatched", "delivered"] },
    });
    const installedOrders = await Order.countDocuments({ status: "installed" });
    // a ticket stays open until the customer confirms the repair works
    const openTickets = await Ticket.countDocuments({ status: { $ne: "confirmed" } });

    const products = await Product.find();
    const lowStockCount = products.filter((p) => p.stock < p.minStock).length;

    // latest 5 orders for the table
    const recentOrders = await Order.find()
      .populate("customer", "name phone")
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      message: "Dashboard data fetched",
      data: {
        revenue: {
          today: todayRevenue,
          week: weekRevenue,
          month: monthRevenue,
          total: totalRevenue,
        },
        collected,
        pendingPayments: totalRevenue - collected,
        profit: totalRevenue - totalCost,
        counts: {
          newEnquiries,
          pendingQuotes,
          unfinishedInstalls,
          installedOrders,
          openTickets,
          lowStockCount,
        },
        recentOrders,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch dashboard data",
      error: error.message,
    });
  }
};