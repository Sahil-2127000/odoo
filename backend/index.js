const express = require("express");
const app = express();

const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const { dbConnect } = require("./config/db");

// routes
const userRoutes = require("./routes/user.routes");
const enquiryRoutes = require("./routes/enquiry.route");
const customerRoutes = require("./routes/customer.route");
const productRoutes = require("./routes/product.route");
const kitRoutes = require("./routes/kit.route");
const orderRoutes = require("./routes/order.route");

const PORT = process.env.PORT || 4000;

// database
dbConnect();

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_BASE_URL,
    credentials: true,
  })
);

// mount routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/enquiries", enquiryRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/products",productRoutes);
app.use("api/v1/kits",kitRoutes);
app.use("/api/v1/orders", orderRoutes);


// health check or just a default routes
app.get("/api/v1", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Solar IMS server is up and running",
  });
});

// unknown routes (keep this LAST)
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});