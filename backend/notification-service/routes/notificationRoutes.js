const express = require("express");

const {
  sendNotification,
  sendBulkNotifications,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getAllNotifications,
} = require("../controllers/notificationController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Notification routes working",
  });
});

// Create notification
router.post("/send", protect, sendNotification);

// Create multiple notifications
router.post("/send-bulk", protect, sendBulkNotifications);

// Logged-in panel notifications
router.get("/my", protect, getMyNotifications);

// Bell unread count
router.get("/unread-count", protect, getUnreadCount);

// Mark read
router.patch("/:id/read", protect, markAsRead);

// Mark all read
router.patch("/read-all", protect, markAllAsRead);

// Delete own notification
router.delete("/:id", protect, deleteNotification);

// Admin view all
router.get("/admin/all", protect, adminOnly, getAllNotifications);

module.exports = router;
