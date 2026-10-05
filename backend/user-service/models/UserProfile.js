const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      default: "Home",
    },

    fullAddress: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      default: "",
    },

    state: {
      type: String,
      default: "",
    },

    pincode: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
  },
  { _id: true },
);

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    profileImage: {
      type: String,
      default: "",
    },

    addresses: {
      type: [addressSchema],
      default: [],
    },

    favoriteFoods: {
      type: [String],
      default: [],
    },

    favoriteHotels: {
      type: [String],
      default: [],
    },

    preferences: {
      vegOnly: {
        type: Boolean,
        default: false,
      },

      favoriteCuisines: {
        type: [String],
        default: [],
      },

      spiceLevel: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH"],
        default: "MEDIUM",
      },
    },
  },
  { timestamps: true },
);

userProfileSchema.index({ "addresses.location": "2dsphere" });

module.exports = mongoose.model("UserProfile", userProfileSchema);
