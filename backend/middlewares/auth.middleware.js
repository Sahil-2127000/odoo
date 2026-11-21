const jwt = require("jsonwebtoken");
require("dotenv").config();

// verify JWT from cookie OR "Authorization: Bearer <token>" header
exports.auth = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing, please log in",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // { id, email, role }
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid or expired",
      });
    }

    next();
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while verifying the token",
    });
  }
};

// role check, e.g. allowRoles("admin", "warehouse")
exports.allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied for role: ${req.user?.role || "unknown"}`,
      });
    }
    next();
  };
};

// shortcuts (admin can access every staff area)
exports.isAdmin = exports.allowRoles("admin");
exports.isCustomerCare = exports.allowRoles("admin", "customer_care");
exports.isTechnician = exports.allowRoles("admin", "technician");
exports.isWarehouse = exports.allowRoles("admin", "warehouse");
exports.isCustomer = exports.allowRoles("customer");
exports.isStaff = exports.allowRoles("admin", "customer_care", "technician", "warehouse");