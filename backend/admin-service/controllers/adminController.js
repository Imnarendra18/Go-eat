const axios = require("axios");
const AdminLog = require("../models/AdminLog");

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL;
const HOTEL_SERVICE = process.env.HOTEL_SERVICE_URL;
const FOOD_SERVICE = process.env.FOOD_SERVICE_URL;
const ORDER_SERVICE = process.env.ORDER_SERVICE_URL;
const PAYMENT_SERVICE = process.env.PAYMENT_SERVICE_URL;

const getAuthHeader = (req) => ({
  headers: {
    Authorization: req.headers.authorization,
  },
});

const createLog = async (
  adminId,
  action,
  targetType,
  targetId,
  details = {},
) => {
  try {
    await AdminLog.create({
      adminId,
      action,
      targetType,
      targetId,
      details,
    });
  } catch (error) {
    console.error("Admin log error:", error.message);
  }
};

// DASHBOARD STATS
exports.getDashboardStats = async (req, res) => {
  try {
    const [hotelsRes, foodsRes, ordersRes, paymentsRes] =
      await Promise.allSettled([
        axios.get(`${HOTEL_SERVICE}/api/hotels`),
        axios.get(`${FOOD_SERVICE}/api/foods`),
        axios.get(`${ORDER_SERVICE}/api/orders/all`, getAuthHeader(req)),
        axios.get(
          `${PAYMENT_SERVICE}/api/payments/all`,
          getAuthHeader(req),
        ),
      ]);

    const hotels =
      hotelsRes.status === "fulfilled" ? hotelsRes.value.data.total || 0 : 0;

    const foods =
      foodsRes.status === "fulfilled" ? foodsRes.value.data.total || 0 : 0;

    const orders =
      ordersRes.status === "fulfilled" ? ordersRes.value.data.total || 0 : 0;

    const payments =
      paymentsRes.status === "fulfilled"
        ? paymentsRes.value.data.total || 0
        : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalHotels: hotels,
        totalFoods: foods,
        totalOrders: orders,
        totalPayments: payments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
};

// GET ALL HOTELS
exports.getAllHotels = async (req, res) => {
  try {
    const response = await axios.get(`${HOTEL_SERVICE}/api/hotels`);

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch hotels",
      error: error.message,
    });
  }
};

// GET ALL FOODS
exports.getAllFoods = async (req, res) => {
  try {
    const response = await axios.get(`${FOOD_SERVICE}/api/foods`);

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch foods",
      error: error.message,
    });
  }
};

// GET ALL ORDERS
exports.getAllOrders = async (req, res) => {
  try {
    const response = await axios.get(
      `${ORDER_SERVICE}/api/orders/all`,
      getAuthHeader(req),
    );

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.response?.data || error.message,
    });
  }
};

// GET PAYMENT BY ORDER
exports.getPaymentByOrder = async (req, res) => {
  try {
    const response = await axios.get(
      `${PAYMENT_SERVICE}/api/payments/order/${req.params.orderId}`,
      getAuthHeader(req),
    );

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: error.response?.data || error.message,
    });
  }
};

// DELETE FOOD AS ADMIN
exports.deleteFoodAsAdmin = async (req, res) => {
  try {
    const response = await axios.delete(
      `${FOOD_SERVICE}/api/foods/admin/${req.params.foodId}`,
      getAuthHeader(req),
    );

    await createLog(
      req.user.userId,
      "DELETE_FOOD",
      "FOOD",
      req.params.foodId,
    );

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete food",
      error: error.response?.data || error.message,
    });
  }
};

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE}/api/auth/admin/users`, {
      ...getAuthHeader(req),
      params: req.query,
    });

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.response?.data || error.message,
    });
  }
};

// BLOCK USER
exports.blockUser = async (req, res) => {
  try {
    const response = await axios.patch(
      `${AUTH_SERVICE}/api/auth/admin/users/${req.params.userId}/block`,
      {},
      getAuthHeader(req),
    );

    await createLog(req.user.userId, "BLOCK_USER", "USER", req.params.userId);

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to block user",
      error: error.response?.data || error.message,
    });
  }
};

// UNBLOCK USER
exports.unblockUser = async (req, res) => {
  try {
    const response = await axios.patch(
      `${AUTH_SERVICE}/api/auth/admin/users/${req.params.userId}/unblock`,
      {},
      getAuthHeader(req),
    );

    await createLog(req.user.userId, "UNBLOCK_USER", "USER", req.params.userId);

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to unblock user",
      error: error.response?.data || error.message,
    });
  }
};

// APPROVE HOTEL
exports.approveHotel = async (req, res) => {
  try {
    const response = await axios.patch(
      `${HOTEL_SERVICE}/api/hotels/admin/${req.params.hotelId}/approve`,
      {},
      getAuthHeader(req),
    );

    await createLog(
      req.user.userId,
      "APPROVE_HOTEL",
      "HOTEL",
      req.params.hotelId,
      { approvalStatus: "APPROVED" },
    );

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to approve hotel",
      error: error.response?.data || error.message,
    });
  }
};

// REJECT HOTEL
exports.rejectHotel = async (req, res) => {
  try {
    await axios.delete(
      `${FOOD_SERVICE}/api/foods/admin/hotel/${req.params.hotelId}`,
      getAuthHeader(req),
    );

    const response = await axios.delete(
      `${HOTEL_SERVICE}/api/hotels/admin/${req.params.hotelId}/reject`,
      getAuthHeader(req),
    );

    await createLog(
      req.user.userId,
      "REJECT_HOTEL",
      "HOTEL",
      req.params.hotelId,
      { deleted: true },
    );

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reject hotel",
      error: error.response?.data || error.message,
    });
  }
};

// GET ADMIN LOGS
exports.getAdminLogs = async (req, res) => {
  try {
    const logs = await AdminLog.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: logs.length,
      logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin logs",
      error: error.message,
    });
  }
};
