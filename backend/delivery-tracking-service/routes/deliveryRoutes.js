const express = require("express");

const {
  createTracking,
  getTrackingByOrderId,
  updateLiveLocation,
  updateDeliveryStatus,
  assignDeliveryPartner,
  getDeliveryPartnerOrders,
  getHotelTrackings,
  getMyTrackings,
  getAllTrackings,
} = require("../controllers/deliveryController");

const {
  protect,
  adminOnly,
  hotelOrAdminOnly,
  deliveryOrHotelOrAdminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Delivery tracking routes working",
  });
});

router.post("/create", protect, hotelOrAdminOnly, createTracking);

router.get("/my", protect, getMyTrackings);

router.get("/all", protect, adminOnly, getAllTrackings);

router.get("/order/:orderId", protect, getTrackingByOrderId);

router.patch(
  "/order/:orderId/location",
  protect,
  deliveryOrHotelOrAdminOnly,
  updateLiveLocation,
);

router.patch(
  "/order/:orderId/status",
  protect,
  deliveryOrHotelOrAdminOnly,
  updateDeliveryStatus,
);

router.patch(
  "/order/:orderId/assign",
  protect,
  hotelOrAdminOnly,
  assignDeliveryPartner,
);

router.get(
  "/partner/:deliveryPartnerId",
  protect,
  deliveryOrHotelOrAdminOnly,
  getDeliveryPartnerOrders,
);

router.get("/hotel/:hotelId", protect, hotelOrAdminOnly, getHotelTrackings);

module.exports = router;
