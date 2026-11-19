
const express = require("express");
const router = express.Router();

const NetworkLog = require("../models/NetworkLog");
const SecurityAlert = require("../models/SecurityAlert");
const EventHistory = require("../models/EventHistory");

const processConnection = require("../automata/failedConnectionTracker");
const checkRestrictedPort = require("../automata/restrictedPort");

// Get DFA Execution History
router.get("/dfa-history", async (req, res) => {
    try {
        const history = await EventHistory.find({
            eventType: "DFA_EXECUTION"
        }).sort({ timestamp: -1 });

        res.status(200).json({
            success: true,
            count: history.length,
            data: history
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

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

        // Determine DFA action and risk
        let action = "No State Change";
        let risk = "Normal";

        if (newLog.status === "SUCCESS") {
            action = "Reset State";
            risk = "Normal";
        } else if (newLog.status === "FAILED") {
            const failureActions = {
                S1: "1st Failure",
                S2: "2nd Failure",
                S3: "3rd Failure",
                S4: "4th Failure",
                S5: "5th Failure"
            };

            action = failureActions[dfaResult.currentState] || "Failure";

            if (dfaResult.currentState === "S3" ||
                dfaResult.currentState === "S4") {
                risk = "Warning";
            }

            if (dfaResult.currentState === "S5") {
                risk = "Critical";
            }
        }

        if (dfaResult.alertTriggered) {
            action = "Critical Alert Triggered";
        } else if (dfaResult.currentState === "S5") {
            action = "Alert State Maintained";
        }

        // Save DFA execution history
        await EventHistory.create({
            sourceIP: newLog.sourceIP,
            eventType: "DFA_EXECUTION",
            description: `DFA processed ${newLog.status}: ${dfaResult.previousState} to ${dfaResult.currentState}`,
            result: dfaResult.alertTriggered
                ? "ALERT"
                : newLog.status === "FAILED"
                    ? "FAILED"
                    : "SUCCESS",
            networkLogId: newLog._id,
            dfaInput: newLog.status,
            previousState: dfaResult.previousState,
            currentState: dfaResult.currentState,
            action: action,
            risk: risk,
            timestamp: newLog.timestamp || new Date()
        });

        // Save normal network event history
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
        const portResult = checkRestrictedPort(
            newLog.destinationPort
        );

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
