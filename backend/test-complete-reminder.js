
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");
const Subscription = require("./models/Subscription");
const sendEmail = require("./config/mailer");

// Get the calendar date in India.
const getIndiaDateKey = (date) => {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((p) => p.type === "year").value);
  const month = Number(parts.find((p) => p.type === "month").value);
  const day = Number(parts.find((p) => p.type === "day").value);

  return Date.UTC(year, month - 1, day);
};

const testCompleteReminder = async () => {
  let testSubscription;

  try {
    if (!process.env.RESEND_TEST_EMAIL) {
      throw new Error("RESEND_TEST_EMAIL is missing from .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected.");

    const user = await User.findOne();

    if (!user) {
      throw new Error("No registered user found.");
    }

    const recipient = process.env.RESEND_TEST_EMAIL;

    // Set the test renewal exactly three India calendar days ahead.
    const today = getIndiaDateKey(new Date());
    const renewalDate = new Date(today + 3 * 24 * 60 * 60 * 1000);

    const reminderDays = 3;

    testSubscription = await Subscription.create({
      user: user._id,
      serviceName: "SubGuard Complete Test",
      category: "Entertainment",
      cost: 100,
      currency: "INR",
      billingCycle: "Monthly",
      nextRenewalDate: renewalDate,
      status: "Active",
      reminderEnabled: true,
      reminderDays,
    });

    console.log("Temporary subscription created.");

    // Confirm reminder eligibility.
    const daysRemaining = Math.round(
      (getIndiaDateKey(renewalDate) - today) /
        (24 * 60 * 60 * 1000)
    );

    if (daysRemaining !== reminderDays) {
      throw new Error("Subscription is not eligible for this reminder.");
    }

    console.log("Eligibility check: PASSED.");

    // Atomically claim this reminder.
    const staleBefore = new Date(Date.now() - 10 * 60 * 1000);

    const claimedSubscription =
      await Subscription.findOneAndUpdate(
        {
          _id: testSubscription._id,
          $and: [
            {
              $or: [
                { reminderClaimedFor: null },
                { reminderClaimedFor: { $ne: renewalDate } },
                { reminderClaimedAt: { $lt: staleBefore } },
              ],
            },
            {
              $or: [
                { lastReminderSentFor: null },
                { lastReminderSentFor: { $ne: renewalDate } },
              ],
            },
          ],
        },
        {
          $set: {
            reminderClaimedFor: renewalDate,
            reminderClaimedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );

    if (!claimedSubscription) {
      throw new Error("Could not claim the reminder.");
    }

    console.log("Atomic claim: PASSED.");

    // Send the test email.
    try {
      await sendEmail({
        to: recipient,
        subject: "SubGuard - Complete Reminder Test",
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>SubGuard Reminder Test</h2>
            <p>Your complete reminder workflow test was successful.</p>
            <p><strong>Test subscription:</strong> SubGuard Complete Test</p>
            <p><strong>Renewal date:</strong>
              ${renewalDate.toLocaleDateString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}
            </p>
            <p><strong>Days remaining:</strong> ${daysRemaining}</p>
            <p>This is a test email. No real subscription payment is involved.</p>
          </div>
        `,
      });

      console.log("Email sending: PASSED.");

      // Save reminder history and release the claim.
      const updatedSubscription =
        await Subscription.findOneAndUpdate(
          {
            _id: testSubscription._id,
            reminderClaimedFor: renewalDate,
          },
          {
            $set: {
              lastReminderSentFor: renewalDate,
              reminderClaimedFor: null,
              reminderClaimedAt: null,
            },
          },
          { returnDocument: "after" }
        );

      if (!updatedSubscription) {
        throw new Error("Email sent, but reminder history was not updated.");
      }

      console.log("Reminder history saved: PASSED.");
      console.log(
        "Last reminder:",
        updatedSubscription.lastReminderSentFor
      );
      console.log(
        "Claim released:",
        updatedSubscription.reminderClaimedFor === null &&
        updatedSubscription.reminderClaimedAt === null
      );

      console.log("\nCOMPLETE REMINDER TEST FINISHED.");

    } catch (emailError) {
      // Release the claim if email sending or processing fails.
      await Subscription.findOneAndUpdate(
        {
          _id: testSubscription._id,
          reminderClaimedFor: renewalDate,
        },
        {
          $set: {
            reminderClaimedFor: null,
            reminderClaimedAt: null,
          },
        }
      );

      throw emailError;
    }

  } catch (error) {
    console.error("COMPLETE TEST FAILED:", error.message);

  } finally {
    if (testSubscription) {
      await Subscription.findByIdAndDelete(testSubscription._id);
      console.log("Temporary subscription deleted.");
    }

    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
};

testCompleteReminder();
