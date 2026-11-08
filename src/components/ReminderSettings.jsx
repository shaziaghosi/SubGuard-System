import { useMemo } from "react";
import {
  Bell,
  BellOff,
  CalendarDays,
  Clock,
  CheckCircle2,
} from "lucide-react";

import "./ReminderSettings.css";

function getTodayDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getDaysDifference(dateString) {
  if (!dateString) return null;

  const renewalDate = new Date(`${dateString}T00:00:00`);
  const today = getTodayDate();

  if (Number.isNaN(renewalDate.getTime())) return null;

  return Math.round(
    (renewalDate - today) / (1000 * 60 * 60 * 24)
  );
}

function formatDate(dateString) {
  if (!dateString) return "Date unavailable";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ReminderSettings({
  subscriptions = [],
  onUpdateSubscription,
}) {
  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "Active"
  );

  const upcomingReminders = useMemo(() => {
    return activeSubscriptions
      .filter((subscription) => {
        const enabled = subscription.reminderEnabled !== false;
        const reminderDays = Number(subscription.reminderDays ?? 3);
        const daysLeft = getDaysDifference(subscription.renewal);

        return (
          enabled &&
          daysLeft !== null &&
          daysLeft >= 0 &&
          daysLeft <= reminderDays
        );
      })
      .sort((a, b) => {
        return (
          getDaysDifference(a.renewal) -
          getDaysDifference(b.renewal)
        );
      });
  }, [activeSubscriptions]);

  const handleReminderToggle = (subscription, enabled) => {
    onUpdateSubscription(subscription.id, {
      reminderEnabled: enabled,
    });
  };

  const handleReminderDaysChange = (subscription, days) => {
    onUpdateSubscription(subscription.id, {
      reminderDays: Number(days),
    });
  };

  return (
    <section className="reminder-settings">
      <div className="reminder-header">
        <div>
          <span className="reminder-eyebrow">
            STAY IN CONTROL
          </span>

          <h2>Notification Preferences</h2>

          <p>
            Manage when SubGuard should remind you about
            upcoming subscription renewals.
          </p>
        </div>

        <div className="reminder-header-icon">
          <Bell size={25} />
        </div>
      </div>

      <div className="reminder-overview">
        <div className="reminder-overview-icon">
          <CalendarDays size={21} />
        </div>

        <div>
          <h3>{upcomingReminders.length} Upcoming Reminders</h3>
          <p>
            Based on your selected reminder preferences.
          </p>
        </div>
      </div>

      <div className="reminder-list">
        <div className="reminder-list-heading">
          <h3>Reminder Settings</h3>
          <span>
            {activeSubscriptions.length} Active Subscriptions
          </span>
        </div>

        {activeSubscriptions.length === 0 ? (
          <div className="reminder-empty">
            <BellOff size={30} />
            <h3>No active subscriptions</h3>
            <p>
              Add or reactivate a subscription to configure
              its renewal reminders.
            </p>
          </div>
        ) : (
          activeSubscriptions.map((subscription) => {
            const enabled = subscription.reminderEnabled !== false;

            const reminderDays = Number(
              subscription.reminderDays ?? 3
            );

            return (
              <div
                className="reminder-item"
                key={subscription.id}
              >
                <div className="reminder-item-info">
                  <div className="reminder-item-icon">
                    <Bell size={19} />
                  </div>

                  <div>
                    <h4>{subscription.name}</h4>
                    <p>
                      Renewal: {formatDate(subscription.renewal)}
                    </p>
                  </div>
                </div>

                <div className="reminder-item-controls">
                  <label className="reminder-toggle">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(event) =>
                        handleReminderToggle(
                          subscription,
                          event.target.checked
                        )
                      }
                    />

                    <span className="reminder-toggle-slider"></span>
                  </label>

                  <select
                    value={reminderDays}
                    disabled={!enabled}
                    onChange={(event) =>
                      handleReminderDaysChange(
                        subscription,
                        event.target.value
                      )
                    }
                  >
                    <option value="1">1 day before</option>
                    <option value="3">3 days before</option>
                    <option value="7">7 days before</option>
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="upcoming-reminder-section">
        <div className="upcoming-reminder-heading">
          <div>
            <h3>Upcoming Renewal Alerts</h3>
            <p>
              Subscriptions matching your reminder settings.
            </p>
          </div>

          <Clock size={21} />
        </div>

        {upcomingReminders.length === 0 ? (
          <div className="no-upcoming-reminders">
            <CheckCircle2 size={23} />
            <p>No upcoming reminders right now.</p>
          </div>
        ) : (
          upcomingReminders.map((subscription) => {
            const daysLeft = getDaysDifference(subscription.renewal);

            return (
              <div
                className="upcoming-reminder-item"
                key={subscription.id}
              >
                <div>
                  <h4>{subscription.name}</h4>
                  <p>
                    Renewal date: {formatDate(subscription.renewal)}
                  </p>
                </div>

                <span>
                  {daysLeft === 0
                    ? "Renews today"
                    : `${daysLeft} day${daysLeft > 1 ? "s" : ""} left`}
                </span>
              </div>
            );
          })
        )}
      </div>

      <p className="reminder-disclaimer">
        These are in-app reminders. Automatic background
        notifications and email alerts will be implemented
        with the backend.
      </p>
    </section>
  );
}

export default ReminderSettings;
