const express = require("express");
const cors = require("cors");
require("dotenv").config();

const recommendationRoutes = require("./routes/recommendationRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("GoEat Recommendation Service is running");
});

app.use("/api/recommendations", recommendationRoutes);

const PORT = process.env.PORT || 5013;

app.listen(PORT, () => {
  console.log(`Recommendation Service running on port ${PORT}`);
});
