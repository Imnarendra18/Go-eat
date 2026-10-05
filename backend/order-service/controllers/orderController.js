const Order = require("../models/Order");

const calculateTotals = (items, deliveryCharge = 30) => {
  const totalItems = items.reduce(
    (sum, item) => sum + Number(item.quantity),
    0,
  );

  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );

  const taxAmount = Math.round(totalAmount * 0.05);
  const finalAmount = totalAmount + deliveryCharge + taxAmount;

  return {
    totalItems,
    totalAmount,
    taxAmount,
    finalAmount,
  };
};

// PLACE ORDER
exports.placeOrder = async (req, res) => {
  try {
    const { userName, userPhone, deliveryAddress, items, paymentMethod } =
      req.body;

    if (!userPhone || !deliveryAddress || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "userPhone, deliveryAddress and items are required",
      });
    }

    const formattedItems = items.map((item) => ({
      foodId: item.foodId,
      hotelId: item.hotelId,
      hotelName: item.hotelName,
      foodName: item.foodName,
      image: item.image || "",
      price: Number(item.price),
      quantity: Number(item.quantity),
      itemTotal: Number(item.price) * Number(item.quantity),
    }));

    const deliveryCharge = 30;
    const totals = calculateTotals(formattedItems, deliveryCharge);

    const order = await Order.create({
      userId: req.user.userId,
      userName,
      userPhone,
      deliveryAddress,
      items: formattedItems,
      totalItems: totals.totalItems,
      totalAmount: totals.totalAmount,
      deliveryCharge,
      taxAmount: totals.taxAmount,
      finalAmount: totals.finalAmount,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: paymentMethod === "COD" ? "PENDING" : "PENDING",
      orderStatus: "PENDING",
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to place order",
      error: error.message,
    });
  }
};

// GET MY ORDERS
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// GET SINGLE ORDER
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      req.user.role === "USER" &&
      order.userId.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this order",
      });
    }

    if (req.user.role === "HOTEL") {
      const hasHotelItem = order.items.some(
        (item) => item.hotelId === req.query.hotelId,
      );

      if (!hasHotelItem) {
        return res.status(403).json({
          success: false,
          message: "This order does not belong to your hotel",
        });
      }
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// GET HOTEL ORDERS
exports.getHotelOrders = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const orders = await Order.find({
      "items.hotelId": hotelId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch hotel orders",
      error: error.message,
    });
  }
};

// UPDATE ORDER STATUS BY HOTEL
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const allowedStatus = [
      "CONFIRMED",
      "PREPARING",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!allowedStatus.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.orderStatus = orderStatus;

    if (orderStatus === "DELIVERED") {
      order.paymentStatus =
        order.paymentMethod === "COD" ? "SUCCESS" : order.paymentStatus;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

// CANCEL ORDER BY USER
exports.cancelOrder = async (req, res) => {
  try {
    const { cancelReason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to cancel this order",
      });
    }

    if (["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is ${order.orderStatus}`,
      });
    }

    order.orderStatus = "CANCELLED";
    order.cancelReason = cancelReason || "Cancelled by user";

    if (order.paymentStatus === "SUCCESS") {
      order.paymentStatus = "PENDING";
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};

// GET ALL ORDERS ADMIN LATER
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch all orders",
      error: error.message,
    });
  }
};
