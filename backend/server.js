
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const logRoutes = require("./routes/logRoutes");
const alertRoutes = require("./routes/alertRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const eventRoutes = require("./routes/eventRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/logs", logRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/events", eventRoutes);

// Test API
app.get("/", (req, res) => {
    res.json({
        message: "Network Security System Backend is Running!"
    });
});

// Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
