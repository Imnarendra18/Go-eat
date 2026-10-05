const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("GoEat Order Service is running");
});

app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 5006;

app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});
