// One warranty formula used everywhere: order.installedAt + product.warrantyYears
// order.items[].product must be populated with at least "warrantyYears"

const itemWarrantyEnd = (order, item) => {
  if (!order.installedAt) return null;
  const end = new Date(order.installedAt);
  end.setFullYear(end.getFullYear() + item.product.warrantyYears);
  return end;
};

// true if ANY item on the order is still inside its warranty period
const isUnderWarranty = (order) => {
  if (!order.installedAt) return false;
  return order.items.some((item) => itemWarrantyEnd(order, item) > new Date());
};

module.exports = { itemWarrantyEnd, isUnderWarranty };
