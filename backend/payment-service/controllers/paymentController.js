const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// CREATE RAZORPAY ORDER
exports.createPaymentOrder = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: "orderId and amount are required",
      });
    }

    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: `goeat_${orderId}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    const payment = await Payment.create({
      userId: req.user.userId,
      orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: Number(amount),
      currency: "INR",
      status: "CREATED",
    });

    res.status(201).json({
      success: true,
      message: "Razorpay order created successfully",
      key: process.env.RAZORPAY_KEY_ID,
      razorpayOrder,
      payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
      error: error.message,
    });
  }
};

// VERIFY PAYMENT
exports.verifyPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification fields",
      });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await Payment.findOneAndUpdate(
        { orderId, razorpayOrderId: razorpay_order_id },
        { status: "FAILED" },
        { new: true },
      );

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const payment = await Payment.findOneAndUpdate(
      { orderId, razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "SUCCESS",
      },
      { new: true },
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
};

// GET PAYMENT BY ORDER ID
exports.getPaymentByOrderId = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      orderId: req.params.orderId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.userId !== req.user.userId && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this payment",
      });
    }

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: error.message,
    });
  }
};

// GET MY PAYMENTS
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: payments.length,
      payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};

// ADMIN GET ALL PAYMENTS
exports.getAllPayments = async (req, res) => {
  try {
    const { status, userId, orderId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (orderId) filter.orderId = orderId;

    const payments = await Payment.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: payments.length,
      payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch all payments",
      error: error.message,
    });
  }
};

// REFUND PAYMENT
exports.refundPayment = async (req, res) => {
  try {
    const { orderId, amount, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    const payment = await Payment.findOne({ orderId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status !== "SUCCESS") {
      return res.status(400).json({
        success: false,
        message: "Only successful payments can be refunded",
      });
    }

    if (!payment.razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: "Razorpay payment id missing",
      });
    }

    const refundAmount = amount ? Number(amount) : payment.amount;

    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: Math.round(refundAmount * 100),
      notes: {
        reason: reason || "GoEat order refund",
      },
    });

    payment.status = "REFUNDED";
    payment.refundId = refund.id;
    payment.refundAmount = refundAmount;
    payment.refundReason = reason || "GoEat order refund";

    await payment.save();

    res.status(200).json({
      success: true,
      message: "Refund created successfully",
      refund,
      payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Refund failed",
      error: error.message,
    });
  }
};
