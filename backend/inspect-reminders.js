
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");
const Subscription = require("./models/Subscription");

const inspectReminders = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const subscriptions = await Subscription.find({})
            .populate("user", "name email");

        console.log("\n===== SUBGUARD REMINDER CHECK =====\n");

        if (subscriptions.length === 0) {
            console.log("No subscriptions found.");
            return;
        }

        subscriptions.forEach((sub, index) => {
            console.log(`Subscription ${index + 1}`);
            console.log("Service:", sub.serviceName);
            console.log("Status:", sub.status);
            console.log("Renewal Date:", sub.nextRenewalDate);
            console.log("Reminder Enabled:", sub.reminderEnabled);
            console.log("Reminder Days:", sub.reminderDays);
            console.log("User Found:", Boolean(sub.user));
            console.log("Email Available:", Boolean(sub.user?.email));
            console.log("Last Reminder:", sub.lastReminderSentFor);
            console.log("Reminder Claimed For:", sub.reminderClaimedFor);
            console.log("Reminder Claimed At:", sub.reminderClaimedAt);
            console.log("------------------------------");
        });

    } catch (error) {
        console.error("Inspection failed:", error.message);
    } finally {
        await mongoose.disconnect();
    }
};
inspectReminders();
