const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    userName: {
      type: String,
      default: "",
    },

    targetType: {
      type: String,
      enum: ["FOOD", "HOTEL"],
      required: true,
    },

    foodId: {
      type: String,
      default: "",
    },

    hotelId: {
      type: String,
      default: "",
    },

    orderId: {
      type: String,
      default: "",
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      default: "",
      trim: true,
    },

    images: {
      type: [String],
      default: [],
    },

    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

reviewSchema.index({ foodId: 1 });
reviewSchema.index({ hotelId: 1 });
reviewSchema.index({ userId: 1 });

module.exports = mongoose.model("Review", reviewSchema);
