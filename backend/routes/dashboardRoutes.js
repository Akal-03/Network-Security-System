
const express = require("express");
const router = express.Router();

const NetworkLog = require("../models/NetworkLog");
const SecurityAlert = require("../models/SecurityAlert");

// Dashboard statistics
router.get("/", async (req, res) => {
    try {
        const totalLogs = await NetworkLog.countDocuments();

        const totalAlerts = await SecurityAlert.countDocuments();

        const failedConnections = await NetworkLog.countDocuments({
            status: "FAILED"
        });

        const criticalAlerts = await SecurityAlert.countDocuments({
            severity: "CRITICAL"
        });

        res.status(200).json({
            success: true,
            data: {
                totalLogs,
                totalAlerts,
                failedConnections,
                criticalAlerts
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
