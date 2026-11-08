require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");
const Subscription = require("./models/Subscription");

const testAtomicClaim = async () => {
  let testSubscription;

  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Find an existing user for the temporary test record.
    const user = await User.findOne();

    if (!user) {
      throw new Error("No user found. Register a user first.");
    }

    const renewalDate = new Date("2026-12-01T00:00:00.000Z");

    testSubscription = await Subscription.create({
      user: user._id,
      serviceName: "Atomic Claim Test",
      category: "Entertainment",
      cost: 100,
      currency: "INR",
      billingCycle: "Monthly",
      nextRenewalDate: renewalDate,
      status: "Active",
      reminderEnabled: true,
      reminderDays: 3,
    });

    console.log("Temporary subscription created.");

    const staleBefore = new Date(Date.now() - 10 * 60 * 1000);

    const claimFilter = {
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
    };

    const claimUpdate = {
      $set: {
        reminderClaimedFor: renewalDate,
        reminderClaimedAt: new Date(),
      },
    };

    // First attempt.
    const firstClaim = await Subscription.findOneAndUpdate(
      claimFilter,
      claimUpdate,
      { returnDocument: "after" }
    );

    console.log(
      "First claim:",
      firstClaim ? "SUCCESS" : "FAILED"
    );

    // Second attempt for the exact same renewal.
    const secondClaim = await Subscription.findOneAndUpdate(
      claimFilter,
      claimUpdate,
      { returnDocument: "after" }
    );

    console.log(
      "Second claim:",
      secondClaim ? "SUCCESS" : "BLOCKED"
    );

    if (firstClaim && !secondClaim) {
      console.log("TEST PASSED: Duplicate claim prevented.");
    } else {
      console.log("TEST FAILED: Unexpected claim result.");
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
testAtomicClaim();
