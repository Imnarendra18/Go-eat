const express = require("express");

const {
  getDashboardStats,
  getAllHotels,
  getAllFoods,
  getAllUsers,
  getAllOrders,
  getPaymentByOrder,
  deleteFoodAsAdmin,
  blockUser,
  unblockUser,
  approveHotel,
  rejectHotel,
  getAdminLogs,
} = require("../controllers/adminController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Admin routes working",
  });
});

router.get("/dashboard", protect, adminOnly, getDashboardStats);

router.get("/hotels", protect, adminOnly, getAllHotels);
router.patch("/hotels/:hotelId/approve", protect, adminOnly, approveHotel);
router.patch("/hotels/:hotelId/reject", protect, adminOnly, rejectHotel);

router.get("/foods", protect, adminOnly, getAllFoods);
router.delete("/foods/:foodId", protect, adminOnly, deleteFoodAsAdmin);

router.get("/users", protect, adminOnly, getAllUsers);

router.get("/orders", protect, adminOnly, getAllOrders);

router.get("/payments/order/:orderId", protect, adminOnly, getPaymentByOrder);

router.patch("/users/:userId/block", protect, adminOnly, blockUser);
router.patch("/users/:userId/unblock", protect, adminOnly, unblockUser);

router.get("/logs", protect, adminOnly, getAdminLogs);

module.exports = router;
