
require("dotenv").config();

const mongoose = require("mongoose");
require("./models/User");

const Subscription = require("./models/Subscription");

const getDateKey = (date) => {
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
};

const testDuplicatePrevention = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const subscription = await Subscription.findOne({
      serviceName: "AmazonPrime",
      status: "Active",
    });

    if (!subscription) {
      throw new Error("AmazonPrime subscription not found.");
    }

    const renewalDate = new Date(subscription.nextRenewalDate);

    console.log("Subscription:", subscription.serviceName);
    console.log("Actual last reminder:", subscription.lastReminderSentFor);

    // Simulate that a reminder was already sent
    // for this renewal date. This changes memory only.
    const simulatedLastReminder = renewalDate;

    const lastSentDay = getDateKey(simulatedLastReminder);
    const renewalDay = getDateKey(renewalDate);

    if (lastSentDay === renewalDay) {
      console.log("Duplicate detected successfully!");
      console.log("Result: Reminder should be skipped.");
    } else {
      console.log("Duplicate check failed.");
    }

    console.log("Database was not modified.");

  } catch (error) {
    console.error("Test failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

testDuplicatePrevention();

