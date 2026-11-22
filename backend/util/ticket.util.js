const Ticket = require("../models/Ticket");
const generateCode = require("./generateCode.util");
const { isUnderWarranty } = require("./warranty.util");

const OUT_OF_WARRANTY_CHARGE = 500; // flat parts + labour charge

// Opens a complaint on an installed order. Warranty is checked automatically,
// so the repair is free (0) or billed (flat charge) from the start.
// order.items.product must be populated with "warrantyYears".
const openTicket = async (order, issue) => {
  const underWarranty = isUnderWarranty(order);

  return Ticket.create({
    code: await generateCode(Ticket, "TK"),
    customer: order.customer._id || order.customer,
    order: order._id,
    issue,
    underWarranty,
    billAmount: underWarranty ? 0 : OUT_OF_WARRANTY_CHARGE,
  });
};

module.exports = { openTicket };
