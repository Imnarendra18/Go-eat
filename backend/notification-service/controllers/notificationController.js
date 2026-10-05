const Notification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");

// SEND NOTIFICATION + OPTIONAL EMAIL
exports.sendNotification = async (req, res) => {
  try {
    const {
      receiverId,
      receiverRole,
      email,
      title,
      message,
      type,
      sendEmail: shouldSendEmail,
      metadata,
    } = req.body;

    if (!receiverId || !receiverRole || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "receiverId, receiverRole, title and message are required",
      });
    }

    const notification = await Notification.create({
      receiverId,
      receiverRole,
      email,
      title,
      message,
      type: type || "GENERAL",
      sendEmail: shouldSendEmail || false,
      metadata: metadata || {},
    });

    let emailStatus = "NOT_REQUESTED";

    if (shouldSendEmail) {
      try {
        await sendEmail({
          to: email,
          subject: title,
          text: message,
          html: `
            <div style="font-family: Arial, sans-serif;">
              <h2>${title}</h2>
              <p>${message}</p>
              <br/>
              <p>Thanks,<br/>GoEat Team</p>
            </div>
          `,
        });

        notification.emailSent = true;
        await notification.save();

        emailStatus = "SENT";
      } catch (emailError) {
        emailStatus = "FAILED";
      }
    }

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      emailStatus,
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
};

// SEND BULK NOTIFICATIONS
exports.sendBulkNotifications = async (req, res) => {
  try {
    const { notifications } = req.body;

    if (!notifications || !Array.isArray(notifications)) {
      return res.status(400).json({
        success: false,
        message: "notifications array is required",
      });
    }

    const createdNotifications = [];

    for (const item of notifications) {
      const notification = await Notification.create({
        receiverId: item.receiverId,
        receiverRole: item.receiverRole,
        email: item.email || "",
        title: item.title,
        message: item.message,
        type: item.type || "GENERAL",
        sendEmail: item.sendEmail || false,
        metadata: item.metadata || {},
      });

      if (item.sendEmail && item.email) {
        try {
          await sendEmail({
            to: item.email,
            subject: item.title,
            text: item.message,
            html: `
              <div style="font-family: Arial, sans-serif;">
                <h2>${item.title}</h2>
                <p>${item.message}</p>
                <br/>
                <p>Thanks,<br/>GoEat Team</p>
              </div>
            `,
          });

          notification.emailSent = true;
          await notification.save();
        } catch (error) {
          notification.emailSent = false;
          await notification.save();
        }
      }

      createdNotifications.push(notification);
    }

    res.status(201).json({
      success: true,
      message: "Bulk notifications created successfully",
      total: createdNotifications.length,
      notifications: createdNotifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send bulk notifications",
      error: error.message,
    });
  }
};

// GET MY NOTIFICATIONS
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      receiverId: req.user.userId,
      receiverRole: req.user.role,
    }).sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      receiverId: req.user.userId,
      receiverRole: req.user.role,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      total: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

// GET UNREAD COUNT
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      receiverId: req.user.userId,
      receiverRole: req.user.role,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message,
    });
  }
};

// MARK ONE AS READ
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (
      notification.receiverId !== req.user.userId ||
      notification.receiverRole !== req.user.role
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

// MARK ALL AS READ
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        receiverId: req.user.userId,
        receiverRole: req.user.role,
      },
      { isRead: true },
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};

// DELETE NOTIFICATION
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (
      notification.receiverId !== req.user.userId ||
      notification.receiverRole !== req.user.role
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};

// ADMIN: GET ALL NOTIFICATIONS
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: notifications.length,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch all notifications",
      error: error.message,
    });
  }
};
