const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: String,
      required: true,
    },

    action: {
      type: String,
      required: true,
    },

    targetType: {
      type: String,
      enum: ["USER", "HOTEL", "FOOD", "ORDER", "PAYMENT", "SYSTEM"],
      default: "SYSTEM",
    },

    targetId: {
      type: String,
      default: "",
    },

    details: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AdminLog", adminLogSchema);
