const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const hotelRoutes = require("./routes/hotelRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("GoEat Hotel Service is running");
});

app.use("/api/hotels", hotelRoutes);

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`Hotel Service running on port ${PORT}`);
});
