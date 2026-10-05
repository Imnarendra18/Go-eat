const express = require("express");

const {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cartController");

const { protect, userOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Cart routes working",
  });
});

router.post("/add", protect, userOnly, addToCart);

router.get("/", protect, userOnly, getCart);

router.put("/update/:itemId", protect, userOnly, updateCartItem);

router.delete("/remove/:itemId", protect, userOnly, removeCartItem);

router.delete("/clear", protect, userOnly, clearCart);

module.exports = router;
