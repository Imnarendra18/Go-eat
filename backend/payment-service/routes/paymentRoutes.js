const express = require("express");

const {
  createPaymentOrder,
  verifyPayment,
  getPaymentByOrderId,
  getMyPayments,
  getAllPayments,
  refundPayment,
} = require("../controllers/paymentController");

const { protect, userOnly, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Payment routes working",
  });
});

router.post("/create-order", protect, userOnly, createPaymentOrder);

router.post("/verify", protect, userOnly, verifyPayment);

router.get("/my-payments", protect, userOnly, getMyPayments);

router.get("/all", protect, adminOnly, getAllPayments);

router.get("/order/:orderId", protect, getPaymentByOrderId);

router.post("/refund", protect, refundPayment);

module.exports = router;
