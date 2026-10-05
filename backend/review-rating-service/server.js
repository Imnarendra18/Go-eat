const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("GoEat Review Rating Service is running");
});

app.use("/api/reviews", reviewRoutes);

const PORT = process.env.PORT || 5011;

app.listen(PORT, () => {
  console.log(`Review Rating Service running on port ${PORT}`);
});
