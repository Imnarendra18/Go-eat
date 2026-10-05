const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("GoEat User Service is running");
});

app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
