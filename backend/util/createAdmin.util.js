require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({ email: "admin@solarflow.in" });

    if (existing) {
      existing.role = "admin"; // fixes it if it was created as a customer
      await existing.save();
      console.log("Admin already existed, role set to admin");
    } else {
      const password = await bcrypt.hash("password123", 10);
      await User.create({
        name: "Admin",
        email: "admin@solarflow.in",
        password,
        role: "admin",
      });
      console.log("Admin created: admin@solarflow.in / password123");
    }

    process.exit(0);
  } catch (error) {
    console.error("Could not create admin:", error.message);
    process.exit(1);
  }
};

createAdmin();