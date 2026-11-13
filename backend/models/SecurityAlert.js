
const mongoose = require("mongoose");

const securityAlertSchema = new mongoose.Schema(
    {
        sourceIP: {
            type: String,
            required: true
        },

        alertType: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        severity: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "MEDIUM"
        },

        status: {
            type: String,
            enum: ["NEW", "REVIEWED", "RESOLVED"],
            default: "NEW"
        },

        detectedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("SecurityAlert", securityAlertSchema);
