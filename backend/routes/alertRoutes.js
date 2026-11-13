
const express = require("express");
const router = express.Router();

const SecurityAlert = require("../models/SecurityAlert");

// Get all security alerts
router.get("/", async (req, res) => {
    try {
        const alerts = await SecurityAlert.find().sort({ detectedAt: -1 });

        res.status(200).json({
            success: true,
            count: alerts.length,
            data: alerts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Add a new security alert
router.post("/", async (req, res) => {
    try {
        const newAlert = await SecurityAlert.create(req.body);

        res.status(201).json({
            success: true,
            message: "Security alert added successfully",
            data: newAlert
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
