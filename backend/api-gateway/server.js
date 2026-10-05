const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");
require("dotenv").config();

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "GoEat API Gateway is running",
  });
});

const makeProxy = (target, prefix) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path) => prefix + path,
    onError: (err, req, res) => {
      res.status(500).json({
        success: false,
        message: "Proxy error",
        error: err.message,
      });
    },
  });

app.use("/api/auth", makeProxy(process.env.AUTH_SERVICE_URL, "/api/auth"));
app.use("/api/users", makeProxy(process.env.USER_SERVICE_URL, "/api/users"));
app.use("/api/hotels", makeProxy(process.env.HOTEL_SERVICE_URL, "/api/hotels"));
app.use("/api/foods", makeProxy(process.env.FOOD_SERVICE_URL, "/api/foods"));
app.use("/api/cart", makeProxy(process.env.CART_SERVICE_URL, "/api/cart"));
app.use("/api/orders", makeProxy(process.env.ORDER_SERVICE_URL, "/api/orders"));
app.use(
  "/api/payments",
  makeProxy(process.env.PAYMENT_SERVICE_URL, "/api/payments"),
);
app.use("/api/ai", makeProxy(process.env.AI_SERVICE_URL, "/api/ai"));
app.use(
  "/api/notifications",
  makeProxy(process.env.NOTIFICATION_SERVICE_URL, "/api/notifications"),
);
app.use("/api/admin", makeProxy(process.env.ADMIN_SERVICE_URL, "/api/admin"));
app.use(
  "/api/reviews",
  makeProxy(process.env.REVIEW_SERVICE_URL, "/api/reviews"),
);
app.use(
  "/api/delivery",
  makeProxy(process.env.DELIVERY_SERVICE_URL, "/api/delivery"),
);
app.use(
  "/api/recommendations",
  makeProxy(process.env.RECOMMENDATION_SERVICE_URL, "/api/recommendations"),
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
