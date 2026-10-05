const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const deliveryTrackingSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },

    userId: {
      type: String,
      required: true,
    },

    hotelId: {
      type: String,
      required: true,
    },

    deliveryPartnerId: {
      type: String,
      default: "",
    },

    deliveryPartnerName: {
      type: String,
      default: "",
    },

    deliveryPartnerPhone: {
      type: String,
      default: "",
    },

    pickupLocation: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
      address: {
        type: String,
        default: "",
      },
    },

    dropLocation: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
      address: {
        type: String,
        default: "",
      },
    },

    currentLocation: {
      type: locationSchema,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "ASSIGNED",
        "PICKED_UP",
        "ON_THE_WAY",
        "NEAR_USER",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "ASSIGNED",
    },

    estimatedMinutes: {
      type: Number,
      default: 30,
    },

    distanceToUserKm: {
      type: Number,
      default: 0,
    },

    locationHistory: {
      type: [locationSchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("DeliveryTracking", deliveryTrackingSchema);
