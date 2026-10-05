const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("GoEat Notification Service is running");
});

app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 5009;

app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});
