const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    receiverId: {
      type: String,
      required: true,
    },

    receiverRole: {
      type: String,
      enum: ["USER", "HOTEL", "ADMIN"],
      required: true,
    },

    email: {
      type: String,
      default: "",
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "GENERAL",
        "ORDER_PLACED",
        "NEW_ORDER",
        "ORDER_STATUS",
        "PAYMENT_SUCCESS",
        "PAYMENT_FAILED",
        "REFUND",
        "HOTEL_APPROVED",
        "HOTEL_REJECTED",
        "ADMIN_ALERT",
      ],
      default: "GENERAL",
    },

    sendEmail: {
      type: Boolean,
      default: false,
    },

    emailSent: {
      type: Boolean,
      default: false,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true },
);

notificationSchema.index({ receiverId: 1, receiverRole: 1 });
notificationSchema.index({ isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
