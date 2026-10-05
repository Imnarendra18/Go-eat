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

const getFoodScore = (food) => {
  const rating = Number(food.rating || 0);
  const totalOrders = Number(food.totalOrders || 0);
  const reviewCount = Number(food.reviewCount || 0);

  return Number((rating * 40 + totalOrders * 0.5 + reviewCount * 2).toFixed(2));
};

const getHotelScore = (hotel) => {
  const rating = Number(hotel.rating || 0);
  const totalOrders = Number(hotel.totalOrders || 0);
  const reviewCount = Number(hotel.reviewCount || 0);

  return Number((rating * 40 + totalOrders * 0.4 + reviewCount * 2).toFixed(2));
};

// TRENDING FOODS
exports.getTrendingFoods = async (req, res) => {
  try {
    const { foods, limit } = req.body;

    if (!foods || !Array.isArray(foods)) {
      return res.status(400).json({
        success: false,
        message: "foods array is required",
      });
    }

    const recommended = foods
      .map((food) => ({
        ...food,
        recommendationScore: getFoodScore(food),
      }))
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit || 10);

    res.status(200).json({
      success: true,
      total: recommended.length,
      foods: recommended,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get trending foods",
      error: error.message,
    });
  }
};

// TOP RATED HOTELS
exports.getTopRatedHotels = async (req, res) => {
  try {
    const { hotels, limit } = req.body;

    if (!hotels || !Array.isArray(hotels)) {
      return res.status(400).json({
        success: false,
        message: "hotels array is required",
      });
    }

    const recommended = hotels
      .map((hotel) => ({
        ...hotel,
        recommendationScore: getHotelScore(hotel),
      }))
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit || 10);

    res.status(200).json({
      success: true,
      total: recommended.length,
      hotels: recommended,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get top hotels",
      error: error.message,
    });
  }
};

// PERSONALIZED FOOD RECOMMENDATION
exports.getPersonalizedFoods = async (req, res) => {
  try {
    const { foods, userPreferences, budget, limit } = req.body;

    if (!foods || !Array.isArray(foods)) {
      return res.status(400).json({
        success: false,
        message: "foods array is required",
      });
    }

    const preferences = userPreferences || {};
    const favoriteCuisines = preferences.favoriteCuisines || [];
    const vegOnly = preferences.vegOnly || false;
    const spiceLevel = preferences.spiceLevel || "";

    let result = foods;

    if (budget) {
      result = result.filter((food) => Number(food.price) <= Number(budget));
    }

    if (vegOnly) {
      result = result.filter((food) => food.isVeg === true);
    }

    result = result.map((food) => {
      let score = getFoodScore(food);

      if (
        favoriteCuisines.some((cuisine) =>
          food.category?.toLowerCase().includes(cuisine.toLowerCase()),
        )
      ) {
        score += 30;
      }

      if (
        spiceLevel &&
        food.spiceLevel &&
        food.spiceLevel.toLowerCase() === spiceLevel.toLowerCase()
      ) {
        score += 15;
      }

      if (food.isAvailable === false) {
        score -= 100;
      }

      return {
        ...food,
        recommendationScore: Number(score.toFixed(2)),
      };
    });

    result = result
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit || 10);

    res.status(200).json({
      success: true,
      total: result.length,
      foods: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get personalized foods",
      error: error.message,
    });
  }
};

// NEARBY HOTELS
exports.getNearbyRecommendedHotels = async (req, res) => {
  try {
    const { hotels, userLocation, radiusKm, limit } = req.body;

    if (!hotels || !Array.isArray(hotels) || !userLocation) {
      return res.status(400).json({
        success: false,
        message: "hotels array and userLocation are required",
      });
    }

    const radius = radiusKm || 20;

    const result = hotels
      .map((hotel) => {
        const distanceKm = calculateDistanceKm(
          Number(userLocation.lat),
          Number(userLocation.lng),
          Number(hotel.lat),
          Number(hotel.lng),
        );

        let score = getHotelScore(hotel);

        if (distanceKm <= 5) score += 30;
        else if (distanceKm <= 10) score += 20;
        else if (distanceKm <= 20) score += 10;

        return {
          ...hotel,
          distanceKm,
          recommendationScore: Number(score.toFixed(2)),
        };
      })
      .filter((hotel) => hotel.distanceKm <= radius)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit || 10);

    res.status(200).json({
      success: true,
      total: result.length,
      hotels: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get nearby recommended hotels",
      error: error.message,
    });
  }
};

// SIMILAR FOODS
exports.getSimilarFoods = async (req, res) => {
  try {
    const { currentFood, foods, limit } = req.body;

    if (!currentFood || !foods || !Array.isArray(foods)) {
      return res.status(400).json({
        success: false,
        message: "currentFood and foods array are required",
      });
    }

    const result = foods
      .filter((food) => food.foodId !== currentFood.foodId)
      .map((food) => {
        let score = getFoodScore(food);

        if (
          food.category?.toLowerCase() === currentFood.category?.toLowerCase()
        ) {
          score += 40;
        }

        if (food.isVeg === currentFood.isVeg) {
          score += 15;
        }

        const priceDifference = Math.abs(
          Number(food.price) - Number(currentFood.price),
        );

        if (priceDifference <= 50) {
          score += 15;
        }

        return {
          ...food,
          recommendationScore: Number(score.toFixed(2)),
        };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit || 6);

    res.status(200).json({
      success: true,
      total: result.length,
      foods: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get similar foods",
      error: error.message,
    });
  }
};
