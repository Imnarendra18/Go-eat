const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("GoEat Admin Service is running");
});

app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5010;

app.listen(PORT, () => {
  console.log(`Admin Service running on port ${PORT}`);
});
