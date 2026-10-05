const express = require("express");

const {
  getTrendingFoods,
  getTopRatedHotels,
  getPersonalizedFoods,
  getNearbyRecommendedHotels,
  getSimilarFoods,
} = require("../controllers/recommendationController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Recommendation routes working",
  });
});

router.post("/trending-foods", getTrendingFoods);

router.post("/top-hotels", getTopRatedHotels);

router.post("/personalized-foods", protect, getPersonalizedFoods);

router.post("/nearby-hotels", getNearbyRecommendedHotels);

router.post("/similar-foods", getSimilarFoods);

module.exports = router;
