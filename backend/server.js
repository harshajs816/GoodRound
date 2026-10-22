
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const prisma = require("./lib/prisma");
const authRoutes = require("./routes/auth");
const golfScoreRoutes = require("./routes/golfScores");
const adminRoutes = require("./routes/admin");
const paymentRoutes = require("./routes/payments");
const charityRoutes = require("./routes/charities");
const subscriptionRoutes = require("./routes/subscriptions");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());




app.use("/api/auth", authRoutes);
app.use("/api/golf-scores", golfScoreRoutes);
app.use("/api/charities", charityRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments",paymentRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "GoodRound API is running",
  });
});


app.listen(PORT, () => {
  console.log(`GoodRound API running on port ${PORT}`);
});
