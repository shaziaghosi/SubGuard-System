
require("dotenv").config();

const mongoose = require("mongoose");
require("./models/User");

const Subscription = require("./models/Subscription");

const testDatabaseReminder = async () => {
  let testSubscription;

  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Find an existing user for the temporary record
    const User = mongoose.model("User");
    const user = await User.findOne();

    if (!user) {
      throw new Error("No user found in database.");
    }

    // Create a temporary subscription
    testSubscription = await Subscription.create({
      user: user._id,
      serviceName: "SubGuardTest",
      category: "Entertainment",
      cost: 100,
      currency: "INR",
      billingCycle: "Monthly",
      nextRenewalDate: new Date("2026-12-01T00:00:00.000Z"),
      status: "Active",
      reminderEnabled: true,
      reminderDays: 1,
      lastReminderSentFor: null,
    });

    console.log("Temporary subscription created.");

    // Simulate successful reminder history update
    const renewalDate = new Date(testSubscription.nextRenewalDate);

    testSubscription.lastReminderSentFor = renewalDate;
    await testSubscription.save();

    console.log("Reminder history saved successfully.");

    // Retrieve the saved record again
    const savedSubscription = await Subscription.findById(
      testSubscription._id
    );

    console.log(
      "Saved reminder date:",
      savedSubscription.lastReminderSentFor
    );

    // Check duplicate prevention
    const lastSent = new Date(savedSubscription.lastReminderSentFor);

    const sameRenewal =
      lastSent.getTime() === renewalDate.getTime();

    if (sameRenewal) {
      console.log("Duplicate detected successfully!");
      console.log("Second reminder should be skipped.");
    } else {
      throw new Error("Duplicate prevention check failed.");
    }

  } catch (error) {
    console.error("Test failed:", error.message);
  } finally {
    if (testSubscription) {
      await Subscription.findByIdAndDelete(testSubscription._id);
      console.log("Temporary subscription deleted.");
    }

    await mongoose.disconnect();
  }
};

testDatabaseReminder();
