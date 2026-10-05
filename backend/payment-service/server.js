const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("GoEat Payment Service is running");
});

app.use("/api/payments", paymentRoutes);

const PORT = process.env.PORT || 5007;

app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});
