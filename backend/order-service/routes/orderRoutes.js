const express = require("express");

const {
  placeOrder,
  getMyOrders,
  getOrderById,
  getHotelOrders,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
} = require("../controllers/orderController");

const {
  protect,
  userOnly,
  hotelOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Order routes working",
  });
});

router.post("/", protect, userOnly, placeOrder);

router.get("/my-orders", protect, userOnly, getMyOrders);

router.get("/hotel/:hotelId", protect, hotelOnly, getHotelOrders);

router.get("/all", protect, getAllOrders);

router.get("/:id", protect, getOrderById);

router.patch("/:id/status", protect, hotelOnly, updateOrderStatus);

router.patch("/:id/cancel", protect, userOnly, cancelOrder);

module.exports = router;
