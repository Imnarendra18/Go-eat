const express = require("express");

const {
  createHotel,
  getAllHotels,
  getHotelById,
  getNearbyHotels,
  updateHotel,
  deleteHotel,
  approveHotelByAdmin,
  rejectHotelByAdmin,
} = require("../controllers/hotelController");

const { protect, hotelOnly, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Hotel routes working",
  });
});

router.post("/", protect, hotelOnly, createHotel);

router.get("/", getAllHotels);

router.get("/nearby", getNearbyHotels);

router.patch("/admin/:id/approve", protect, adminOnly, approveHotelByAdmin);

router.delete("/admin/:id/reject", protect, adminOnly, rejectHotelByAdmin);

router.get("/:id", getHotelById);

router.put("/:id", protect, hotelOnly, updateHotel);

router.delete("/:id", protect, hotelOnly, deleteHotel);

module.exports = router;
