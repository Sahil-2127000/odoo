require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../models/User");
const Customer = require("../models/Customer");
const Enquiry = require("../models/Enquiry");
const Product = require("../models/Product");
const Kit = require("../models/Kit");
const Order = require("../models/Order");
const Ticket = require("../models/Ticket");

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB connected, clearing old data...");

    // 1. clear old data
    await User.deleteMany();
    await Customer.deleteMany();
    await Enquiry.deleteMany();
    await Product.deleteMany();
    await Kit.deleteMany();
    await Order.deleteMany();
    await Ticket.deleteMany();

    // 2. staff users (password for all: password123)
    const password = await bcrypt.hash("password123", 10);

    await User.create([
      { name: "Admin", email: "admin@solarflow.in", password, role: "admin" },
      { name: "Simran Kaur", email: "care@solarflow.in", password, role: "customer_care" },
      { name: "Manoj Kumar", email: "warehouse@solarflow.in", password, role: "warehouse" },
    ]);
    const tech = await User.create({
      name: "Gurpreet Singh", email: "tech@solarflow.in", password, role: "technician",
    });
    // second technician, so sales can choose whoever is free
    await User.create({ name: "Ravinder Pal", email: "tech2@solarflow.in", password, role: "technician" });

    // 3. products
    const panel = await Product.create({ name: "Solar Panel 540W", category: "panel", costPrice: 11800, sellPrice: 14500, stock: 40, minStock: 20, warrantyYears: 25 });
    const inverter = await Product.create({ name: "Inverter 5kW", category: "inverter", costPrice: 51000, sellPrice: 62000, stock: 4, minStock: 5, warrantyYears: 10 });
    const inverter3 = await Product.create({ name: "Inverter 3kW", category: "inverter", costPrice: 36000, sellPrice: 44000, stock: 6, minStock: 3, warrantyYears: 10 });
    const battery = await Product.create({ name: "Lithium Battery 5kWh", category: "battery", costPrice: 118000, sellPrice: 145000, stock: 2, minStock: 3, warrantyYears: 8 });
    const structure = await Product.create({ name: "Mounting Structure", category: "other", costPrice: 4200, sellPrice: 5600, stock: 50, minStock: 10, warrantyYears: 10 });
    // small parts nobody should have to remember
    const cable = await Product.create({ name: "DC Cable 4 sq mm (per metre)", category: "cable", costPrice: 45, sellPrice: 60, stock: 500, minStock: 100, warrantyYears: 5 });
    const box = await Product.create({ name: "AC/DC Distribution Box with switches", category: "other", costPrice: 2800, sellPrice: 3800, stock: 20, minStock: 5, warrantyYears: 2 });
    const earthing = await Product.create({ name: "Earthing Kit with Lightning Arrester", category: "other", costPrice: 1800, sellPrice: 2500, stock: 25, minStock: 5, warrantyYears: 5 });
    const mc4 = await Product.create({ name: "MC4 Connector Pair", category: "other", costPrice: 90, sellPrice: 150, stock: 200, minStock: 50, warrantyYears: 1 });

    // 4. kits: On-Grid, and Off-Grid = same parts + a battery for backup.
    // The cable qty is a default; the quote uses the length measured in the site survey.
    const safetyParts = (connectors) => [
      { product: cable._id, qty: 20 },
      { product: box._id, qty: 1 },
      { product: earthing._id, qty: 1 },
      { product: mc4._id, qty: connectors },
    ];
    const kit3 = [
      { product: panel._id, qty: 6 },
      { product: inverter3._id, qty: 1 },
      { product: structure._id, qty: 3 },
      ...safetyParts(4),
    ];
    const kit5 = [
      { product: panel._id, qty: 10 },
      { product: inverter._id, qty: 1 },
      { product: structure._id, qty: 5 },
      ...safetyParts(6),
    ];
    const withBattery = (items) => [...items, { product: battery._id, qty: 1 }];

    // kit price = sell price x qty of every part (same rule as the kit API)
    const allProducts = [panel, inverter, inverter3, battery, structure, cable, box, earthing, mc4];
    const priceOf = (items) =>
      items.reduce((sum, i) => sum + allProducts.find((p) => p._id.equals(i.product)).sellPrice * i.qty, 0);
    const kit = (name, systemType, capacityKw, items) => ({ name, systemType, capacityKw, items, price: priceOf(items) });

    await Kit.create([
      kit("3 kW On-Grid Kit", "on_grid", 3, kit3),
      kit("3 kW Off-Grid Kit", "off_grid", 3, withBattery(kit3)),
      kit("5 kW On-Grid Kit", "on_grid", 5, kit5),
      kit("5 kW Off-Grid Kit", "off_grid", 5, withBattery(kit5)),
    ]);

    // 5. customers
    const c1 = await Customer.create({ code: "CU-1001", name: "Harpreet Singh", phone: "9815488213", email: "harpreet@gmail.com", address: "112 Model Town, Ludhiana" });
    // customer portal login for the demo customer (installed order + open complaint)
    await User.create({ name: "Harpreet Singh", email: "harpreet@gmail.com", phone: "9815488213", password, role: "customer", customer: c1._id });
    const c2 = await Customer.create({ code: "CU-1002", name: "Meena Agarwal", phone: "9781033092", address: "8 Urban Estate, Jalandhar" });
    const c3 = await Customer.create({ code: "CU-1003", name: "Gurdeep Dhillon", phone: "9872261034", address: "45 Sarabha Nagar, Ludhiana" });
    const c4 = await Customer.create({ code: "CU-1004", name: "Sunrise Public School", phone: "9915047820", address: "GT Road, Moga" });

    // 6. orders: one at each stage (same kit for all)
    const items = [
      { product: panel._id, qty: 10, price: 14500 },
      { product: inverter._id, qty: 1, price: 62000 },
      { product: structure._id, qty: 5, price: 5600 },
    ];
    const total = Math.round(235000 * 1.18); // 277300 incl. 18% GST
    const totalCost = 190000;                // 10×11800 + 51000 + 5×4200

    const system = { systemType: "on_grid", capacityKw: 5 };

    // orders already past dispatch have the serial numbers the warehouse typed in
    const o1 = await Order.create({ code: "OR-1001", customer: c1._id, ...system, items, total, totalCost, amountPaid: total, status: "installed", installedAt: daysAgo(12), serials: ["INV5-24-0117", "PNL540-24-3301", "PNL540-24-3302"] });
    await Order.create({ code: "OR-1002", customer: c2._id, ...system, items, total, totalCost, amountPaid: 150000, status: "delivered", serials: ["INV5-24-0121", "PNL540-24-3415", "PNL540-24-3416"] });
    await Order.create({ code: "OR-1003", customer: c3._id, ...system, items, total, totalCost, amountPaid: 50000, status: "confirmed" });
    await Order.create({ code: "OR-1004", customer: c4._id, ...system, items, total, totalCost, amountPaid: 0, status: "quoted" });

    // 7. enquiries
    await Enquiry.create([
      { code: "EN-1001", name: "Amandeep Kaur", phone: "9814022751", city: "Ludhiana", systemType: "off_grid", capacityKw: 3, status: "new", note: "Wants solar for 2-floor house, frequent power cuts" },
      { code: "EN-1002", name: "Vikram Malhotra", phone: "9872261099", city: "Jalandhar", systemType: "on_grid", capacityKw: 5, status: "follow_up", note: "Wants EMI options", nextFollowUp: new Date() },
      { code: "EN-1003", name: "Anil Sood", phone: "9417056631", city: "Khanna", systemType: "on_grid", capacityKw: 3, status: "lost", note: "Budget too low" },
    ]);

    // 8. complaint on the installed order, assigned to technician
    await Ticket.create({
      code: "TK-1001",
      customer: c1._id,
      order: o1._id,
      issue: "Inverter showing error light",
      status: "assigned",
      assignedTo: tech._id,
      underWarranty: true, // installed 12 days ago, well inside warranty
      billAmount: 0,
    });

    console.log("✅ Seed complete");
    console.log("Staff logins (password123): admin@ care@ warehouse@ tech@ tech2@solarflow.in");
    console.log("Customer portal (password123): harpreet@gmail.com");
    console.log("Track order demo: phone 9815488213 + code OR-1001");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }
};

seed();