const Cart = require("../models/Cart");

const calculateCartTotals = (cart) => {
  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  cart.totalAmount = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  cart.items.forEach((item) => {
    item.itemTotal = item.price * item.quantity;
  });

  return cart;
};

// ADD TO CART
exports.addToCart = async (req, res) => {
  try {
    const { foodId, hotelId, foodName, hotelName, image, price, quantity } =
      req.body;

    if (!foodId || !hotelId || !foodName || !hotelName || !price) {
      return res.status(400).json({
        success: false,
        message: "foodId, hotelId, foodName, hotelName and price are required",
      });
    }

    const userId = req.user.userId;
    const itemQuantity = quantity || 1;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) => item.foodId.toString() === foodId,
    );

    if (existingItem) {
      existingItem.quantity += itemQuantity;
      existingItem.itemTotal = existingItem.price * existingItem.quantity;
    } else {
      cart.items.push({
        foodId,
        hotelId,
        foodName,
        hotelName,
        image,
        price,
        quantity: itemQuantity,
        itemTotal: price * itemQuantity,
      });
    }

    calculateCartTotals(cart);
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Item added to cart",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
      error: error.message,
    });
  }
};

// GET CART
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [],
        totalItems: 0,
        totalAmount: 0,
      });
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
};

// UPDATE QUANTITY
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    item.quantity = quantity;
    item.itemTotal = item.price * quantity;

    calculateCartTotals(cart);
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart item updated",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update cart item",
      error: error.message,
    });
  }
};

// REMOVE ITEM
exports.removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    cart.items.pull(itemId);

    calculateCartTotals(cart);
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to remove item",
      error: error.message,
    });
  }
};

// CLEAR CART
exports.clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart) {
      cart = await Cart.create({
        userId: req.user.userId,
        items: [],
      });
    }

    cart.items = [];
    cart.totalItems = 0;
    cart.totalAmount = 0;

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message,
    });
  }
};
