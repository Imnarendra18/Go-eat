const DeliveryTracking = require("../models/DeliveryTracking");

const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((R * c).toFixed(2));
};

// CREATE TRACKING
exports.createTracking = async (req, res) => {
  try {
    const {
      orderId,
      userId,
      hotelId,
      deliveryPartnerId,
      deliveryPartnerName,
      deliveryPartnerPhone,
      pickupLocation,
      dropLocation,
      estimatedMinutes,
    } = req.body;

    if (!orderId || !userId || !hotelId || !pickupLocation || !dropLocation) {
      return res.status(400).json({
        success: false,
        message:
          "orderId, userId, hotelId, pickupLocation and dropLocation are required",
      });
    }

    const existingTracking = await DeliveryTracking.findOne({ orderId });

    if (existingTracking) {
      return res.status(409).json({
        success: false,
        message: "Tracking already exists for this order",
      });
    }

    const tracking = await DeliveryTracking.create({
      orderId,
      userId,
      hotelId,
      deliveryPartnerId: deliveryPartnerId || "",
      deliveryPartnerName: deliveryPartnerName || "",
      deliveryPartnerPhone: deliveryPartnerPhone || "",
      pickupLocation,
      dropLocation,
      currentLocation: {
        lat: pickupLocation.lat,
        lng: pickupLocation.lng,
        updatedAt: new Date(),
      },
      estimatedMinutes: estimatedMinutes || 30,
      status: "ASSIGNED",
      locationHistory: [
        {
          lat: pickupLocation.lat,
          lng: pickupLocation.lng,
          updatedAt: new Date(),
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Delivery tracking created successfully",
      tracking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create delivery tracking",
      error: error.message,
    });
  }
};

// GET TRACKING BY ORDER ID
exports.getTrackingByOrderId = async (req, res) => {
  try {
    const tracking = await DeliveryTracking.findOne({
      orderId: req.params.orderId,
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    if (
      req.user.role === "USER" &&
      tracking.userId.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this tracking",
      });
    }

    res.status(200).json({
      success: true,
      tracking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tracking",
      error: error.message,
    });
  }
};

// UPDATE LIVE LOCATION
exports.updateLiveLocation = async (req, res) => {
  try {
    const { lat, lng, estimatedMinutes } = req.body;

    if (lat === undefined || lng === undefined || lat === "" || lng === "") {
      return res.status(400).json({
        success: false,
        message: "lat and lng are required",
      });
    }

    const tracking = await DeliveryTracking.findOne({
      orderId: req.params.orderId,
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    if (
      req.user.role === "DELIVERY" &&
      tracking.deliveryPartnerId.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this delivery",
      });
    }

    const distanceToUserKm = calculateDistanceKm(
      Number(lat),
      Number(lng),
      tracking.dropLocation.lat,
      tracking.dropLocation.lng,
    );

    tracking.currentLocation = {
      lat: Number(lat),
      lng: Number(lng),
      updatedAt: new Date(),
    };

    tracking.distanceToUserKm = distanceToUserKm;

    if (estimatedMinutes !== undefined) {
      tracking.estimatedMinutes = Number(estimatedMinutes);
    }

    tracking.locationHistory.push({
      lat: Number(lat),
      lng: Number(lng),
      updatedAt: new Date(),
    });

    if (distanceToUserKm <= 0.5 && tracking.status === "ON_THE_WAY") {
      tracking.status = "NEAR_USER";
    }

    await tracking.save();

    res.status(200).json({
      success: true,
      message: "Live location updated successfully",
      tracking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update live location",
      error: error.message,
    });
  }
};

// UPDATE DELIVERY STATUS
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatus = [
      "ASSIGNED",
      "PICKED_UP",
      "ON_THE_WAY",
      "NEAR_USER",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery status",
      });
    }

    const tracking = await DeliveryTracking.findOne({
      orderId: req.params.orderId,
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    if (
      req.user.role === "DELIVERY" &&
      tracking.deliveryPartnerId.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this delivery",
      });
    }

    tracking.status = status;

    if (status === "DELIVERED") {
      tracking.distanceToUserKm = 0;
      tracking.estimatedMinutes = 0;
    }

    await tracking.save();

    res.status(200).json({
      success: true,
      message: "Delivery status updated successfully",
      tracking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update delivery status",
      error: error.message,
    });
  }
};

// ASSIGN DELIVERY PARTNER
exports.assignDeliveryPartner = async (req, res) => {
  try {
    const { deliveryPartnerId, deliveryPartnerName, deliveryPartnerPhone } =
      req.body;

    const tracking = await DeliveryTracking.findOneAndUpdate(
      { orderId: req.params.orderId },
      {
        deliveryPartnerId,
        deliveryPartnerName,
        deliveryPartnerPhone,
        status: "ASSIGNED",
      },
      { new: true },
    );

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Delivery partner assigned successfully",
      tracking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to assign delivery partner",
      error: error.message,
    });
  }
};

// GET TRACKINGS BY DELIVERY PARTNER
exports.getDeliveryPartnerOrders = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;
    const { scope, status } = req.query;

    if (
      req.user.role === "DELIVERY" &&
      deliveryPartnerId.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this partner's orders",
      });
    }

    const filter = {
      deliveryPartnerId,
    };

    if (status) {
      filter.status = status;
    } else if (scope === "history") {
      filter.status = { $in: ["DELIVERED", "CANCELLED"] };
    } else if (scope !== "all") {
      filter.status = { $nin: ["DELIVERED", "CANCELLED"] };
    }

    const trackings = await DeliveryTracking.find(filter).sort({
      updatedAt: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      total: trackings.length,
      trackings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery partner orders",
      error: error.message,
    });
  }
};

// GET HOTEL DELIVERY TRACKINGS
exports.getHotelTrackings = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const trackings = await DeliveryTracking.find({
      hotelId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: trackings.length,
      trackings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch hotel trackings",
      error: error.message,
    });
  }
};

// GET USER DELIVERY TRACKINGS
exports.getMyTrackings = async (req, res) => {
  try {
    const trackings = await DeliveryTracking.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: trackings.length,
      trackings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch your trackings",
      error: error.message,
    });
  }
};

// ADMIN GET ALL
exports.getAllTrackings = async (req, res) => {
  try {
    const trackings = await DeliveryTracking.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: trackings.length,
      trackings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch all trackings",
      error: error.message,
    });
  }
};
