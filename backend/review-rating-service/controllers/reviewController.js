const Review = require("../models/Review");

const getAverage = async (filter) => {
  const result = await Review.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
    };
  }

  return {
    averageRating: Number(result[0].averageRating.toFixed(1)),
    totalReviews: result[0].totalReviews,
  };
};

// CREATE REVIEW
exports.createReview = async (req, res) => {
  try {
    const {
      userName,
      targetType,
      foodId,
      hotelId,
      orderId,
      rating,
      comment,
      images,
    } = req.body;

    if (!targetType || !rating) {
      return res.status(400).json({
        success: false,
        message: "targetType and rating are required",
      });
    }

    if (!["FOOD", "HOTEL"].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: "targetType must be FOOD or HOTEL",
      });
    }

    if (targetType === "FOOD" && !foodId) {
      return res.status(400).json({
        success: false,
        message: "foodId is required for food review",
      });
    }

    if (targetType === "HOTEL" && !hotelId) {
      return res.status(400).json({
        success: false,
        message: "hotelId is required for hotel review",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const duplicateFilter = {
      userId: req.user.userId,
      targetType,
    };

    if (targetType === "FOOD") duplicateFilter.foodId = foodId;
    if (targetType === "HOTEL") duplicateFilter.hotelId = hotelId;

    const existingReview = await Review.findOne(duplicateFilter);

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You already reviewed this item",
      });
    }

    const review = await Review.create({
      userId: req.user.userId,
      userName,
      targetType,
      foodId: foodId || "",
      hotelId: hotelId || "",
      orderId: orderId || "",
      rating,
      comment,
      images: images || [],
    });

    const average =
      targetType === "FOOD"
        ? await getAverage({ targetType: "FOOD", foodId })
        : await getAverage({ targetType: "HOTEL", hotelId });

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
      average,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create review",
      error: error.message,
    });
  }
};

// GET ALL REVIEWS
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: reviews.length,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

// GET REVIEWS BY FOOD
exports.getReviewsByFood = async (req, res) => {
  try {
    const { foodId } = req.params;

    const reviews = await Review.find({
      targetType: "FOOD",
      foodId,
    }).sort({ createdAt: -1 });

    const average = await getAverage({
      targetType: "FOOD",
      foodId,
    });

    res.status(200).json({
      success: true,
      total: reviews.length,
      average,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch food reviews",
      error: error.message,
    });
  }
};

// GET REVIEWS BY HOTEL
exports.getReviewsByHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const reviews = await Review.find({
      targetType: "HOTEL",
      hotelId,
    }).sort({ createdAt: -1 });

    const average = await getAverage({
      targetType: "HOTEL",
      hotelId,
    });

    res.status(200).json({
      success: true,
      total: reviews.length,
      average,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch hotel reviews",
      error: error.message,
    });
  }
};

// GET MY REVIEWS
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: reviews.length,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch your reviews",
      error: error.message,
    });
  }
};

// UPDATE REVIEW
exports.updateReview = async (req, res) => {
  try {
    const { rating, comment, images } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this review",
      });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    review.rating = rating ?? review.rating;
    review.comment = comment ?? review.comment;
    review.images = images ?? review.images;
    review.isEdited = true;

    await review.save();

    const average =
      review.targetType === "FOOD"
        ? await getAverage({ targetType: "FOOD", foodId: review.foodId })
        : await getAverage({ targetType: "HOTEL", hotelId: review.hotelId });

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
      average,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error.message,
    });
  }
};

// DELETE REVIEW
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.userId !== req.user.userId && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this review",
      });
    }

    const targetType = review.targetType;
    const foodId = review.foodId;
    const hotelId = review.hotelId;

    await review.deleteOne();

    const average =
      targetType === "FOOD"
        ? await getAverage({ targetType: "FOOD", foodId })
        : await getAverage({ targetType: "HOTEL", hotelId });

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
      average,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message,
    });
  }
};

// GET AVERAGE RATING
exports.getAverageRating = async (req, res) => {
  try {
    const { targetType, targetId } = req.query;

    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        message: "targetType and targetId are required",
      });
    }

    const filter =
      targetType === "FOOD"
        ? { targetType: "FOOD", foodId: targetId }
        : { targetType: "HOTEL", hotelId: targetId };

    const average = await getAverage(filter);

    res.status(200).json({
      success: true,
      average,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to calculate average rating",
      error: error.message,
    });
  }
};
