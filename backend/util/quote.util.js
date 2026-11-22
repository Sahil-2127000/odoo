const Order = require("../models/Order");
const Kit = require("../models/Kit");
const generateCode = require("./generateCode.util");

// Builds a quote (an order in "quoted" status) from a kit template.
// Every part of the kit is copied with today's price, so nobody has to remember small parts.
// If the site survey measured the cable length, the cable line uses that many metres
// instead of the kit's default. Returns null if the kit does not exist.
const createQuoteFromKit = async (customerId, kitId, cableMeters) => {
  const kit = await Kit.findById(kitId).populate("items.product");
  if (!kit) return null;

  let subtotal = 0;
  let totalCost = 0;
  const items = [];

  for (const item of kit.items) {
    const product = item.product;
    const qty = product.category === "cable" && cableMeters > 0 ? cableMeters : item.qty;

    items.push({ product: product._id, qty, price: product.sellPrice });
    subtotal = subtotal + product.sellPrice * qty;
    totalCost = totalCost + product.costPrice * qty;
  }

  return Order.create({
    code: await generateCode(Order, "OR"),
    customer: customerId,
    systemType: kit.systemType,
    capacityKw: kit.capacityKw,
    items,
    total: Math.round(subtotal * 1.18), // add 18% GST
    totalCost,
  });
};

module.exports = { createQuoteFromKit };
