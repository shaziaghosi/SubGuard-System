const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const protect = require("./middleware/authMiddleware");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const startReminderScheduler = require("./jobs/reminderScheduler");


const app = express();

// Middleware
app.use(cors({
   origin: [
    "http://localhost:3000",
    process.env.FRONTEND_URL
  ].filter(Boolean),
}));

app.use(express.json());
// Temporary protected route


// Authentication routes
app.use("/api/auth", authRoutes);

app.use("/api/subscriptions", subscriptionRoutes);
// Temporary protected route
app.get("/api/protected", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You have accessed a protected route!",
    userId: req.user,
  });
});

// Home test route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SubGuard Backend is running!",
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();

      startReminderScheduler();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();