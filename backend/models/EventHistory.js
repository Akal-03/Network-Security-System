
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
