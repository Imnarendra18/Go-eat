const Hotel = require("../models/Hotel");

// CREATE HOTEL
exports.createHotel = async (req, res) => {
  try {
    const {
      hotelName,
      description,
      address,
      phone,
      image,
      cuisines,
      lat,
      lng,
    } = req.body;

    if (!hotelName || !address || !phone || !lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const hotel = await Hotel.create({
      ownerId: req.user.userId,
      hotelName,
      description,
      address,
      phone,
      image,
      cuisines,
      location: {
        type: "Point",
        coordinates: [Number(lng), Number(lat)],
      },
    });

    res.status(201).json({
      success: true,
      message: "Hotel created successfully",
      hotel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create hotel",
      error: error.message,
    });
  }
};

// GET ALL HOTELS
exports.getAllHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: hotels.length,
      hotels,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch hotels",
      error: error.message,
    });
  }
};

// GET SINGLE HOTEL
exports.getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    res.status(200).json({
      success: true,
      hotel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch hotel",
      error: error.message,
    });
  }
};

// GET NEARBY HOTELS
exports.getNearbyHotels = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude required",
      });
    }

    const distance = radius ? Number(radius) * 1000 : 20000;

    const hotels = await Hotel.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: distance,
        },
      },
    });

    res.status(200).json({
      success: true,
      total: hotels.length,
      hotels,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch nearby hotels",
      error: error.message,
    });
  }
};

// UPDATE HOTEL
exports.updateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    if (hotel.ownerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const updatedHotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: "Hotel updated successfully",
      hotel: updatedHotel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update hotel",
      error: error.message,
    });
  }
};

// DELETE HOTEL
exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    if (hotel.ownerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await hotel.deleteOne();

    res.status(200).json({
      success: true,
      message: "Hotel deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete hotel",
      error: error.message,
    });
  }
};

// APPROVE HOTEL BY ADMIN
exports.approveHotelByAdmin = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus: "APPROVED",
        isApproved: true,
      },
      { new: true },
    );

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Hotel approved successfully",
      hotel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to approve hotel",
      error: error.message,
    });
  }
};

// REJECT HOTEL BY ADMIN
exports.rejectHotelByAdmin = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    await hotel.deleteOne();

    res.status(200).json({
      success: true,
      message: "Hotel rejected and deleted successfully",
      hotelId: req.params.id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reject hotel",
      error: error.message,
    });
  }
};
