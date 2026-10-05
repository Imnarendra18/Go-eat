const Food = require("../models/Food");

// ADD FOOD
exports.addFood = async (req, res) => {
  try {
    const {
      hotelId,
      hotelName,
      name,
      description,
      price,
      category,
      image,
      isVeg,
      preparationTime,
    } = req.body;

    if (!hotelId || !hotelName || !name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "hotelId, hotelName, name, price and category are required",
      });
    }

    const food = await Food.create({
      hotelId,
      ownerId: req.user.userId,
      hotelName,
      name,
      description,
      price,
      category,
      image,
      isVeg,
      preparationTime,
    });

    res.status(201).json({
      success: true,
      message: "Food added successfully",
      food,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add food",
      error: error.message,
    });
  }
};

// GET ALL FOODS
exports.getAllFoods = async (req, res) => {
  try {
    const { search, category, isVeg } = req.query;

    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (category) {
      filter.category = { $regex: category, $options: "i" };
    }

    if (isVeg === "true") {
      filter.isVeg = true;
    }

    if (isVeg === "false") {
      filter.isVeg = false;
    }

    const foods = await Food.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: foods.length,
      foods,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch foods",
      error: error.message,
    });
  }
};

// GET SINGLE FOOD
exports.getFoodById = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    res.status(200).json({
      success: true,
      food,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch food",
      error: error.message,
    });
  }
};

// GET FOODS BY HOTEL
exports.getFoodsByHotel = async (req, res) => {
  try {
    const foods = await Food.find({
      hotelId: req.params.hotelId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: foods.length,
      foods,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch hotel foods",
      error: error.message,
    });
  }
};

// GET MY HOTEL FOODS
exports.getMyFoods = async (req, res) => {
  try {
    const foods = await Food.find({
      ownerId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: foods.length,
      foods,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch your foods",
      error: error.message,
    });
  }
};

// UPDATE FOOD
exports.updateFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    if (food.ownerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this food",
      });
    }

    const updatedFood = await Food.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Food updated successfully",
      food: updatedFood,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update food",
      error: error.message,
    });
  }
};

// DELETE FOOD
exports.deleteFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    if (food.ownerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this food",
      });
    }

    await food.deleteOne();

    res.status(200).json({
      success: true,
      message: "Food deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete food",
      error: error.message,
    });
  }
};

// TOGGLE AVAILABILITY
exports.toggleAvailability = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    if (food.ownerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    food.isAvailable = !food.isAvailable;
    await food.save();

    res.status(200).json({
      success: true,
      message: "Food availability updated",
      food,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update availability",
      error: error.message,
    });
  }
};

// DELETE FOOD BY ADMIN
exports.deleteFoodAsAdmin = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    await food.deleteOne();

    res.status(200).json({
      success: true,
      message: "Food deleted by admin successfully",
      foodId: req.params.id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete food as admin",
      error: error.message,
    });
  }
};

// DELETE HOTEL FOODS BY ADMIN
exports.deleteFoodsByHotelAsAdmin = async (req, res) => {
  try {
    const result = await Food.deleteMany({
      hotelId: req.params.hotelId,
    });

    res.status(200).json({
      success: true,
      message: "Hotel foods deleted by admin successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete hotel foods as admin",
      error: error.message,
    });
  }
};
