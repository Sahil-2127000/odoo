const Customer = require("../models/Customer");
const Order = require("../models/Order");
const generateCode = require("../util/generateCode.util");

// POST /api/v1/customers
exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    const customer = await Customer.create({
      code: await generateCode(Customer, "CU"),
      name,
      phone,
      email,
      address,
    });

    return res.status(201).json({
      success: true,
      message: "Customer created",
      data: customer,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not create customer",
      error: error.message,
    });
  }
};

// GET /api/v1/customers?phone=9815488213
exports.getCustomers = async (req, res) => {
    try {
      const filter = {};
  
      if (req.query.phone) {
        filter.phone = req.query.phone;   // exact match
      }
  
      const customers = await Customer.find(filter).sort({ createdAt: -1 });
  
      return res.status(200).json({
        success: true,
        message: "Customers fetched",
        data: customers,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Could not fetch customers",
        error: error.message,
      });
    }
  };

// GET /api/v1/customers/:id   (customer + their orders)
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const orders = await Order.find({ customer: customer._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Customer fetched",
      data: { customer, orders },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch customer",
      error: error.message,
    });
  }
};