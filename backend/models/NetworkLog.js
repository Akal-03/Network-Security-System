
const mongoose = require("mongoose");

const networkLogSchema = new mongoose.Schema(
    {
        sourceIP: {
            type: String,
            required: [true, "Source IP is required"]
        },

        destinationIP: {
            type: String,
            required: [true, "Destination IP is required"]
        },

        sourcePort: {
            type: Number,
            min: 0,
            max: 65535
        },

        destinationPort: {
            type: Number,
            required: [true, "Destination port is required"],
            min: 0,
            max: 65535
        },

        protocol: {
            type: String,
            enum: ["TCP", "UDP", "HTTP", "HTTPS", "OTHER"],
            default: "TCP"
        },

        status: {
            type: String,
            enum: ["SUCCESS", "FAILED", "OTHER"],
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

module.exports = mongoose.model("NetworkLog", networkLogSchema);
