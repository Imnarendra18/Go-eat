const UserProfile = require("../models/UserProfile");

// GET MY PROFILE
exports.getProfile = async (req, res) => {
  try {
    let profile = await UserProfile.findOne({
      userId: req.user.userId,
    });

    if (!profile) {
      profile = await UserProfile.create({
        userId: req.user.userId,
      });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

// CREATE OR UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, profileImage } = req.body;

    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user.userId },
      {
        name,
        email,
        phone,
        profileImage,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// ADD ADDRESS
exports.addAddress = async (req, res) => {
  try {
    const {
      label,
      fullAddress,
      city,
      state,
      pincode,
      phone,
      lat,
      lng,
      isDefault,
    } = req.body;

    if (!fullAddress) {
      return res.status(400).json({
        success: false,
        message: "Full address is required",
      });
    }

    let profile = await UserProfile.findOne({ userId: req.user.userId });

    if (!profile) {
      profile = await UserProfile.create({
        userId: req.user.userId,
      });
    }

    if (isDefault) {
      profile.addresses.forEach((address) => {
        address.isDefault = false;
      });
    }

    profile.addresses.push({
      label,
      fullAddress,
      city,
      state,
      pincode,
      phone,
      isDefault: isDefault || profile.addresses.length === 0,
      location: {
        type: "Point",
        coordinates: [Number(lng) || 0, Number(lat) || 0],
      },
    });

    await profile.save();

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add address",
      error: error.message,
    });
  }
};

// UPDATE ADDRESS
exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const profile = await UserProfile.findOne({ userId: req.user.userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const address = profile.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const {
      label,
      fullAddress,
      city,
      state,
      pincode,
      phone,
      lat,
      lng,
      isDefault,
    } = req.body;

    if (isDefault) {
      profile.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    address.label = label ?? address.label;
    address.fullAddress = fullAddress ?? address.fullAddress;
    address.city = city ?? address.city;
    address.state = state ?? address.state;
    address.pincode = pincode ?? address.pincode;
    address.phone = phone ?? address.phone;
    address.isDefault = isDefault ?? address.isDefault;

    if (lat && lng) {
      address.location = {
        type: "Point",
        coordinates: [Number(lng), Number(lat)],
      };
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update address",
      error: error.message,
    });
  }
};

// DELETE ADDRESS
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const profile = await UserProfile.findOne({ userId: req.user.userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const address = profile.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    profile.addresses.pull(addressId);

    if (
      profile.addresses.length > 0 &&
      !profile.addresses.some((addr) => addr.isDefault)
    ) {
      profile.addresses[0].isDefault = true;
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete address",
      error: error.message,
    });
  }
};

// SET DEFAULT ADDRESS
exports.setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const profile = await UserProfile.findOne({ userId: req.user.userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const address = profile.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    profile.addresses.forEach((addr) => {
      addr.isDefault = false;
    });

    address.isDefault = true;

    await profile.save();

    res.status(200).json({
      success: true,
      message: "Default address updated",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to set default address",
      error: error.message,
    });
  }
};

// ADD FAVORITE FOOD
exports.addFavoriteFood = async (req, res) => {
  try {
    const { foodId } = req.body;

    if (!foodId) {
      return res.status(400).json({
        success: false,
        message: "foodId is required",
      });
    }

    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { $addToSet: { favoriteFoods: foodId } },
      { new: true, upsert: true },
    );

    res.status(200).json({
      success: true,
      message: "Food added to favorites",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add favorite food",
      error: error.message,
    });
  }
};

// REMOVE FAVORITE FOOD
exports.removeFavoriteFood = async (req, res) => {
  try {
    const { foodId } = req.params;

    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { $pull: { favoriteFoods: foodId } },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: "Food removed from favorites",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to remove favorite food",
      error: error.message,
    });
  }
};

// ADD FAVORITE HOTEL
exports.addFavoriteHotel = async (req, res) => {
  try {
    const { hotelId } = req.body;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "hotelId is required",
      });
    }

    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { $addToSet: { favoriteHotels: hotelId } },
      { new: true, upsert: true },
    );

    res.status(200).json({
      success: true,
      message: "Hotel added to favorites",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add favorite hotel",
      error: error.message,
    });
  }
};

// REMOVE FAVORITE HOTEL
exports.removeFavoriteHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { $pull: { favoriteHotels: hotelId } },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: "Hotel removed from favorites",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to remove favorite hotel",
      error: error.message,
    });
  }
};

// UPDATE PREFERENCES
exports.updatePreferences = async (req, res) => {
  try {
    const { vegOnly, favoriteCuisines, spiceLevel } = req.body;

    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user.userId },
      {
        preferences: {
          vegOnly,
          favoriteCuisines,
          spiceLevel,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      success: true,
      message: "Preferences updated successfully",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update preferences",
      error: error.message,
    });
  }
};
