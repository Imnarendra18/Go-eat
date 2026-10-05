const express = require("express");

const {
  createReview,
  getAllReviews,
  getReviewsByFood,
  getReviewsByHotel,
  getMyReviews,
  updateReview,
  deleteReview,
  getAverageRating,
} = require("../controllers/reviewController");

const { protect, userOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Review routes working",
  });
});

router.post("/", protect, userOnly, createReview);

router.get("/", getAllReviews);

router.get("/average", getAverageRating);

router.get("/my-reviews", protect, userOnly, getMyReviews);

router.get("/food/:foodId", getReviewsByFood);

router.get("/hotel/:hotelId", getReviewsByHotel);

router.put("/:id", protect, userOnly, updateReview);

router.delete("/:id", protect, deleteReview);

module.exports = router;
