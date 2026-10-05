const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const cartRoutes = require("./routes/cartRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("GoEat Cart Service is running");
});

app.use("/api/cart", cartRoutes);

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`Cart Service running on port ${PORT}`);
});
