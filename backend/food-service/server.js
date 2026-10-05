const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const foodRoutes = require("./routes/foodRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("GoEat Food Service is running");
});

app.use("/api/foods", foodRoutes);

const PORT = process.env.PORT || 5004;

app.listen(PORT, () => {
  console.log(`Food Service running on port ${PORT}`);
});
