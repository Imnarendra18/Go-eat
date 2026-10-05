const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const deliveryRoutes = require("./routes/deliveryRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("GoEat Delivery Tracking Service is running");
});

app.use("/api/delivery", deliveryRoutes);

const PORT = process.env.PORT || 5012;

app.listen(PORT, () => {
  console.log(`Delivery Tracking Service running on port ${PORT}`);
});
