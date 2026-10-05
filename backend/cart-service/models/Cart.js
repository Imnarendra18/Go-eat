const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    foodId: {
      type: String,
      required: true,
    },

    hotelId: {
      type: String,
      required: true,
    },

    foodName: {
      type: String,
      required: true,
    },

    hotelName: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },

    itemTotal: {
      type: Number,
      required: true,
    },
  },
  { _id: true },
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },

    items: {
      type: [cartItemSchema],
      default: [],
    },

    totalItems: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Cart", cartSchema);
