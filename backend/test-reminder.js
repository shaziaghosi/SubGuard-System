
require("dotenv").config();

const mongoose = require("mongoose");
require("./models/User");

const Subscription = require("./models/Subscription");
const sendEmail = require("./config/mailer");

const testReminder = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const testEmail = process.env.RESEND_TEST_EMAIL;

    if (!testEmail) {
      throw new Error("RESEND_TEST_EMAIL is missing from .env");
    }

    const subscription = await Subscription.findOne({
      serviceName: "AmazonPrime",
      status: "Active",
      reminderEnabled: true,
    });

    if (!subscription) {
      throw new Error("Eligible AmazonPrime subscription not found.");
    }

    const renewalDate = new Date(subscription.nextRenewalDate);

    const simulatedToday = new Date(renewalDate);
    simulatedToday.setUTCDate(
      simulatedToday.getUTCDate() - subscription.reminderDays
    );

    const daysRemaining = Math.round(
      (Date.UTC(
        renewalDate.getUTCFullYear(),
        renewalDate.getUTCMonth(),
        renewalDate.getUTCDate()
      ) -
        Date.UTC(
          simulatedToday.getUTCFullYear(),
          simulatedToday.getUTCMonth(),
          simulatedToday.getUTCDate()
        )) /
        (24 * 60 * 60 * 1000)
    );

    if (daysRemaining !== subscription.reminderDays) {
      throw new Error("Reminder eligibility check failed.");
    }

    if (subscription.lastReminderSentFor) {
      const lastSent = new Date(subscription.lastReminderSentFor);

      if (
        Date.UTC(lastSent.getUTCFullYear(), lastSent.getUTCMonth(), lastSent.getUTCDate()) ===
        Date.UTC(renewalDate.getUTCFullYear(), renewalDate.getUTCMonth(), renewalDate.getUTCDate())
      ) {
        throw new Error("A reminder is already recorded for this renewal.");
      }
    }

    console.log("Subscription:", subscription.serviceName);
    console.log("Simulated reminder date:", simulatedToday.toISOString());
    console.log("Days remaining:", daysRemaining);
    console.log("Sending test email to verified address...");

    await sendEmail({
      to: testEmail,
      subject: "SubGuard - AmazonPrime Reminder Test",
      html: `
        <h2>SubGuard Reminder Test</h2>
        <p>Your AmazonPrime subscription is renewing in 1 day.</p>
        <p><strong>Renewal date:</strong> ${renewalDate.toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
        })}</p>
        <p>This is a simulated test. Your actual subscription data has not been changed.</p>
      `,
    });

    console.log("Test email request completed successfully.");

  } catch (error) {
    console.error("Test failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

testReminder();

