const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    hotelId: {
      type: String,
      required: true,
    },

    ownerId: {
      type: String,
      required: true,
    },

    hotelName: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    isVeg: {
      type: Boolean,
      default: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    rating: {
      type: Number,
      default: 0,
    },

    preparationTime: {
      type: Number,
      default: 20,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Food", foodSchema);
