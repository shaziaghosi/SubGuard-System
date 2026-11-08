
const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
    {
        // User who owns this subscription
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        serviceName: {
            type: String,
            required: true,
            trim: true,
        },

        category: {
            type: String,
            default: "Other",
        },

        cost: {
            type: Number,
            required: true,
            min: 0,
        },

        currency: {
            type: String,
            default: "INR",
        },

        billingCycle: {
            type: String,
            enum: ["Monthly", "Yearly", "Weekly", "Daily", "Quarterly"],
            required: true,
        },

        nextRenewalDate: {
            type: Date,
            required: true,
        },

        isFreeTrial: {
            type: Boolean,
            default: false,
        },

        trialEndDate: {
            type: Date,
            default: null,
        },

        status: {
            type: String,
            enum: ["Active", "Paused", "Cancelled"],
            default: "Active",
        },

        cancelUrl: {
            type: String,
            default: "",
        },

        reminderEnabled: {
            type: Boolean,
            default: true,
        },

        reminderDays: {
            type: Number,
            enum: [1, 3, 7],
            default: 3,
        },

        lastReminderSentFor: {
            type: Date,
            default: null,
        },
        reminderClaimedFor: {
            type: Date,
            default: null,
        },

        reminderClaimedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Subscription = mongoose.model(
    "Subscription",
    subscriptionSchema
);

module.exports = Subscription;
