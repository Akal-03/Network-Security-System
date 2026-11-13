
const express = require("express");
const router = express.Router();

const NetworkLog = require("../models/NetworkLog");
const SecurityAlert = require("../models/SecurityAlert");
const EventHistory = require("../models/EventHistory");

const processConnection = require("../automata/failedConnectionTracker");
const checkRestrictedPort = require("../automata/restrictedPort");

// Get all network logs
router.get("/", async (req, res) => {
    try {
        const logs = await NetworkLog.find().sort({ timestamp: -1 });

        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Add network log and process security checks
router.post("/", async (req, res) => {
    try {
        const newLog = await NetworkLog.create(req.body);

        // DFA processing
        const dfaResult = processConnection(
            newLog.sourceIP,
            newLog.status
        );

        // Restricted port detection
        const portResult = checkRestrictedPort(
            newLog.destinationPort
        );

        // Save network event history
        await EventHistory.create({
            sourceIP: newLog.sourceIP,
            eventType: "NETWORK_CONNECTION",
            description: `Connection status: ${newLog.status}. DFA State: ${dfaResult.currentState}`,
            result: newLog.status === "FAILED" ? "FAILED" : "SUCCESS"
        });

        const alerts = [];

        // DFA Security Alert
        if (dfaResult.alertTriggered) {
            const dfaAlert = await SecurityAlert.create({
                sourceIP: newLog.sourceIP,
                alertType: "REPEATED_FAILED_CONNECTIONS",
                description: "5 consecutive failed connection attempts detected from this IP address.",
                severity: "HIGH",
                status: "NEW"
            });

            alerts.push(dfaAlert);

            await EventHistory.create({
                sourceIP: newLog.sourceIP,
                eventType: "SECURITY_ALERT",
                description: "Security alert generated after 5 consecutive failed connections.",
                result: "ALERT"
            });
        }

        // Restricted Port Security Alert
        if (portResult.restricted) {
            const portAlert = await SecurityAlert.create({
                sourceIP: newLog.sourceIP,
                alertType: "RESTRICTED_PORT_ACCESS",
                description: portResult.message,
                severity: "HIGH",
                status: "NEW"
            });

            alerts.push(portAlert);

            await EventHistory.create({
                sourceIP: newLog.sourceIP,
                eventType: "SECURITY_ALERT",
                description: portResult.message,
                result: "ALERT"
            });
        }

        res.status(201).json({
            success: true,
            message: "Network log processed successfully",
            data: newLog,
            dfa: dfaResult,
            portCheck: portResult,
            alerts: alerts
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
