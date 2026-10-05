const jwt = require("jsonwebtoken");

exports.protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

exports.hotelOrAdminOnly = (req, res, next) => {
  if (req.user.role !== "HOTEL" && req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Only hotel or admin can perform this action",
    });
  }

  next();
};

exports.adminOnly = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Only admin can perform this action",
    });
  }

  next();
};

exports.deliveryOrHotelOrAdminOnly = (req, res, next) => {
  if (
    req.user.role !== "DELIVERY" &&
    req.user.role !== "HOTEL" &&
    req.user.role !== "ADMIN"
  ) {
    return res.status(403).json({
      success: false,
      message: "Only delivery, hotel or admin can perform this action",
    });
  }

  next();
};
