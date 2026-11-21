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

    // 3. products
    const panel = await Product.create({ name: "Solar Panel 540W", category: "panel", costPrice: 11800, sellPrice: 14500, stock: 40, minStock: 20, warrantyYears: 25 });
    const inverter = await Product.create({ name: "Inverter 5kW", category: "inverter", costPrice: 51000, sellPrice: 62000, stock: 4, minStock: 5, warrantyYears: 10 });
    await Product.create({ name: "Lithium Battery 5kWh", category: "battery", costPrice: 118000, sellPrice: 145000, stock: 2, minStock: 3, warrantyYears: 8 });
    const structure = await Product.create({ name: "Mounting Structure", category: "other", costPrice: 4200, sellPrice: 5600, stock: 50, minStock: 10, warrantyYears: 10 });

    // 4. kit: 10 panels + 1 inverter + 5 structures
    const kit = await Kit.create({
      name: "5 kW On-Grid Kit",
      items: [
        { product: panel._id, qty: 10 },
        { product: inverter._id, qty: 1 },
        { product: structure._id, qty: 5 },
      ],
      price: 235000, // 10×14500 + 62000 + 5×5600
    });

    // 5. customers
    const c1 = await Customer.create({ code: "CU-1001", name: "Harpreet Singh", phone: "9815488213", email: "harpreet@gmail.com", address: "112 Model Town, Ludhiana" });
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

    const o1 = await Order.create({ code: "OR-1001", customer: c1._id, items, total, totalCost, amountPaid: total, status: "installed", installedAt: daysAgo(12) });
    await Order.create({ code: "OR-1002", customer: c2._id, items, total, totalCost, amountPaid: 150000, status: "delivered" });
    await Order.create({ code: "OR-1003", customer: c3._id, items, total, totalCost, amountPaid: 50000, status: "confirmed" });
    await Order.create({ code: "OR-1004", customer: c4._id, items, total, totalCost, amountPaid: 0, status: "quoted" });

    // 7. enquiries
    await Enquiry.create([
      { code: "EN-1001", name: "Amandeep Kaur", phone: "9814022751", city: "Ludhiana", status: "new", note: "Wants solar for 2-floor house" },
      { code: "EN-1002", name: "Vikram Malhotra", phone: "9872261099", city: "Jalandhar", status: "follow_up", note: "Wants EMI options", nextFollowUp: new Date() },
      { code: "EN-1003", name: "Anil Sood", phone: "9417056631", city: "Khanna", status: "lost", note: "Budget too low" },
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
    console.log("Staff logins (password123): admin@ care@ warehouse@ tech@solarflow.in");
    console.log("Track order demo: phone 9815488213 + code OR-1001");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }
};

seed();