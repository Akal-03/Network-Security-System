
const express = require("express");
const router = express.Router();

const EventHistory = require("../models/EventHistory");

// Get all event histories
router.get("/", async (req, res) => {
    try {
        const events = await EventHistory.find().sort({
            timestamp: -1
        });

        res.status(200).json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Add a new event history
router.post("/", async (req, res) => {
    try {
        const newEvent = await EventHistory.create(req.body);

        res.status(201).json({
            success: true,
            message: "Event history added successfully",
            data: newEvent
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
