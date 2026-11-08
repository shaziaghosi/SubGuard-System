
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Subscription = require("./models/Subscription");
const reminderScheduler = require("./jobs/reminderScheduler");

const getIndiaDateKey = (date) => {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find(p => p.type === "year").value);
  const month = Number(parts.find(p => p.type === "month").value);
  const day = Number(parts.find(p => p.type === "day").value);

  return Date.UTC(year, month - 1, day);
};

const runTest = async () => {
  let temporarySubscription;

  try {
    if (!process.env.RESEND_TEST_EMAIL) {
      throw new Error("RESEND_TEST_EMAIL is missing from .env");
    }

    await connectDB();
    console.log("MongoDB connected.");

    if (typeof reminderScheduler.checkUpcomingReminders !== "function") {
      throw new Error("checkUpcomingReminders function not exported.");
    }

    const user = await User.findOne();

    if (!user) {
      throw new Error("No existing user found in database.");
    }

    // Set renewal date exactly 3 India calendar days from today.
    const today = getIndiaDateKey(new Date());
    const renewalDate = new Date(today + 3 * 24 * 60 * 60 * 1000);

    temporarySubscription = await Subscription.create({
      user: user._id,
      serviceName: "SubGuard Scheduler Test",
      category: "Other",
      cost: 99,
      currency: "INR",
      billingCycle: "Monthly",
      nextRenewalDate: renewalDate,
      status: "Active",
      reminderEnabled: true,
      reminderDays: 3,
      lastReminderSentFor: null,
      reminderClaimedFor: null,
      reminderClaimedAt: null,
    });

    console.log("Temporary subscription created.");

    // First run: should send one test email.
    console.log("\n--- FIRST SCHEDULER RUN ---");

    await reminderScheduler.checkUpcomingReminders({
      testRecipient: process.env.RESEND_TEST_EMAIL,
      onlySubscriptionId: temporarySubscription._id,
    });

    const afterFirstRun = await Subscription.findById(
      temporarySubscription._id
    );

    if (
      !afterFirstRun ||
      !afterFirstRun.lastReminderSentFor ||
      afterFirstRun.reminderClaimedFor !== null ||
      afterFirstRun.reminderClaimedAt !== null
    ) {
      throw new Error("First scheduler run did not complete correctly.");
    }

    console.log("FIRST RUN: PASSED");
    console.log("Reminder history saved.");
    console.log("Claim fields released.");

    // Second run: should not send another email.
    console.log("\n--- SECOND SCHEDULER RUN ---");

    await reminderScheduler.checkUpcomingReminders({
      testRecipient: process.env.RESEND_TEST_EMAIL,
      onlySubscriptionId: temporarySubscription._id,
    });

    const afterSecondRun = await Subscription.findById(
      temporarySubscription._id
    );

    if (
      !afterSecondRun ||
      !afterSecondRun.lastReminderSentFor ||
      afterSecondRun.lastReminderSentFor.getTime() !==
        afterFirstRun.lastReminderSentFor.getTime()
    ) {
      throw new Error("Duplicate prevention check failed.");
    }

    console.log("SECOND RUN: PASSED");
    console.log("Duplicate reminder prevented.");

    console.log("\nREAL SCHEDULER TEST PASSED.");

  } catch (error) {
    console.error("\nTEST FAILED:", error.message);

  } finally {
    if (temporarySubscription) {
      await Subscription.findByIdAndDelete(temporarySubscription._id);
      console.log("Temporary subscription deleted.");
    }

    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
};

runTest();
