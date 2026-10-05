const express = require("express");

const {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  addFavoriteFood,
  removeFavoriteFood,
  addFavoriteHotel,
  removeFavoriteHotel,
  updatePreferences,
} = require("../controllers/userController");

const { protect, userOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "User routes working",
  });
});

router.get("/profile", protect, userOnly, getProfile);
router.put("/profile", protect, userOnly, updateProfile);

router.post("/address", protect, userOnly, addAddress);
router.put("/address/:addressId", protect, userOnly, updateAddress);
router.delete("/address/:addressId", protect, userOnly, deleteAddress);
router.patch(
  "/address/:addressId/default",
  protect,
  userOnly,
  setDefaultAddress,
);

router.post("/favorites/food", protect, userOnly, addFavoriteFood);
router.delete("/favorites/food/:foodId", protect, userOnly, removeFavoriteFood);

router.post("/favorites/hotel", protect, userOnly, addFavoriteHotel);
router.delete(
  "/favorites/hotel/:hotelId",
  protect,
  userOnly,
  removeFavoriteHotel,
);

router.put("/preferences", protect, userOnly, updatePreferences);

module.exports = router;
