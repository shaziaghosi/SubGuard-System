const cron = require("node-cron");
const Subscription = require("../models/Subscription");
const sendEmail = require("../config/mailer");

const ONE_DAY = 24 * 60 * 60 * 1000;


// Convert a date into its calendar-day value in India.
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

// Process eligible subscription reminders.
const checkUpcomingReminders = async ({
    testRecipient = null,
    onlySubscriptionId = null,
} = {}) => {
     console.log("Checking upcoming subscription renewals...");

    try {
        const query = {
            status: "Active",
            reminderEnabled: true,
            nextRenewalDate: { $exists: true, $ne: null },
        };

        if (onlySubscriptionId) {
            query._id = onlySubscriptionId;
        }

        const subscriptions = await Subscription.find(query)
            .populate("user", "name email");

        const today = getIndiaDateKey(new Date());

        for (const subscription of subscriptions) {
            let renewalDate;

            try {
                if (!subscription.user?.email) {
                    console.log(`No user email: ${subscription.serviceName}`);
                    continue;
                }

                renewalDate = new Date(subscription.nextRenewalDate);

                const renewalDay = getIndiaDateKey(renewalDate);

                const daysRemaining = Math.round(
                    (renewalDay - today) / ONE_DAY
                );

                // Skip expired renewals.
                if (daysRemaining < 0) {
                    console.log(`Expired renewal skipped: ${subscription.serviceName}`);
                    continue;
                }

                // Send only on the user's selected reminder day.
                if (daysRemaining !== subscription.reminderDays) {
                    continue;
                }

                // Atomically claim this reminder.
                // A claim older than 10 minutes can be retried.
                const staleBefore = new Date(Date.now() - 10 * 60 * 1000);

                const claimedSubscription =
                    await Subscription.findOneAndUpdate(
                        {
                            _id: subscription._id,
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
                    console.log(
                        `Reminder already claimed or sent: ${subscription.serviceName}`
                    );
                    continue;
                }

                const formattedDate = renewalDate.toLocaleDateString(
                    "en-IN",
                    { timeZone: "Asia/Kolkata" }
                );

                try {
                    await sendEmail({
                        to: testRecipient || subscription.user.email,
                        subject: `Upcoming renewal: ${subscription.serviceName}`,
                        html: `
              <div style="font-family: Arial, sans-serif;">
                <h2>Hello ${subscription.user.name || "there"}!</h2>

                <p>This is a reminder from <strong>SubGuard</strong>.</p>

                <p>Your subscription
                <strong>${subscription.serviceName}</strong>
                is renewing in ${daysRemaining} day(s).</p>

                <p><strong>Renewal date:</strong> ${formattedDate}</p>

                <p><strong>Amount:</strong>
                ${subscription.currency || "INR"} ${subscription.cost}</p>

                <p>Please review your subscription before it renews.</p>

                <p>Regards,<br />SubGuard Team</p>
              </div>
            `,
                    });

                    // Save successful reminder history and release claim.
                    await Subscription.findOneAndUpdate(
                        {
                            _id: subscription._id,
                            reminderClaimedFor: renewalDate,
                        },
                        {
                            $set: {
                                lastReminderSentFor: renewalDate,
                                reminderClaimedFor: null,
                                reminderClaimedAt: null,
                            },
                        }
                    );

                    console.log(
                        `Reminder sent successfully: ${subscription.serviceName}`
                    );

                } catch (emailError) {
                    // Release claim if sending fails.
                    await Subscription.findOneAndUpdate(
                        {
                            _id: subscription._id,
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
                console.error(
                    `Reminder failed for ${subscription.serviceName}:`,
                    error.message
                );
            }
        }

        console.log("Renewal reminder check completed.");

    } catch (error) {
        console.error("Scheduler error:", error.message);
    }
};

// Start the automatic daily schedule.
const startReminderScheduler = () => {
    cron.schedule(
        "0 9 * * *",
        checkUpcomingReminders,
        {
            timezone: "Asia/Kolkata",
        }
    );

    console.log("SubGuard reminder scheduler started.");
};

module.exports = startReminderScheduler;

// Export the same function for manual testing.
module.exports.checkUpcomingReminders = checkUpcomingReminders;


