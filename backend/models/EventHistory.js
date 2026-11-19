
const mongoose = require("mongoose");

const eventHistorySchema = new mongoose.Schema(
    {
        sourceIP: {
            type: String,
            required: true
        },

        eventType: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        result: {
            type: String,
            enum: ["SUCCESS", "FAILED", "ALERT"],
            required: true
        },

        // DFA Execution Details
        networkLogId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "NetworkLog"
        },

        dfaInput: {
            type: String
        },

        previousState: {
            type: String
        },

        currentState: {
            type: String
        },

        action: {
            type: String
        },

        risk: {
            type: String,
            enum: ["Normal", "Warning", "Critical"]
        },

        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("EventHistory", eventHistorySchema);
