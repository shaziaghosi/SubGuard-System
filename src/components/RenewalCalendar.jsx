
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Bell,
  Clock3,
  CreditCard,
  Gift,
} from "lucide-react";

import "./RenewalCalendar.css";

function RenewalCalendar({ subscriptions = [] }) {
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [selectedDate, setSelectedDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  );

  // Format a date as YYYY-MM-DD using local date values
  const makeDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // Convert YYYY-MM-DD into a readable date
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Calculate days from today
  const getDaysDifference = (dateString) => {
    if (!dateString) return null;

    const [year, month, day] = dateString.split("-").map(Number);
    const target = new Date(year, month - 1, day);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return Math.round(
      (target.getTime() - startOfToday.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  // Build calendar events from active subscriptions
  const events = useMemo(() => {
    const eventList = [];

    subscriptions
      .filter((subscription) => (subscription.status || "Active") === "Active")
      .forEach((subscription) => {
        if (subscription.renewal) {
          eventList.push({
            id: `${subscription.name}-renewal`,
            date: subscription.renewal,
            name: subscription.name,
            type: "renewal",
            amount: Number(subscription.amount) || 0,
            billingCycle: subscription.billingCycle || "Monthly",
          });
        }

        if (subscription.isFreeTrial && subscription.trialEndDate) {
          eventList.push({
            id: `${subscription.name}-trial`,
            date: subscription.trialEndDate,
            name: subscription.name,
            type: "trial",
            amount: Number(subscription.amount) || 0,
            billingCycle: subscription.billingCycle || "Monthly",
          });
        }
      });

    return eventList;
  }, [subscriptions]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    return events.reduce((grouped, event) => {
      if (!grouped[event.date]) {
        grouped[event.date] = [];
      }

      grouped[event.date].push(event);
      return grouped;
    }, {});
  }, [events]);

  // Get first day of month and number of days
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Convert Sunday-first index to Monday-first calendar
  const startingDay = (firstDay.getDay() + 6) % 7;

  // Create calendar cells
  const calendarCells = [
    ...Array(startingDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  // Keep calendar grid at six rows
  while (calendarCells.length < 42) {
    calendarCells.push(null);
  }

  // Events for selected date
  const selectedEvents = eventsByDate[selectedDate] || [];

  // Upcoming events within the next 30 days
  const upcomingEvents = events
    .map((event) => ({
      ...event,
      daysLeft: getDaysDifference(event.date),
    }))
    .filter(
      (event) => event.daysLeft !== null &&
        event.daysLeft >= 0 &&
        event.daysLeft <= 30
    )
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Navigate between months
  const changeMonth = (direction) => {
    setCurrentMonth(
      new Date(year, month + direction, 1)
    );
  };

  // Select a calendar date
  const selectDate = (day) => {
    if (!day) return;

    const date = new Date(year, month, day);
    setSelectedDate(makeDateKey(date));
  };

  // Check if a day is today
  const isToday = (day) => {
    if (!day) return false;

    return makeDateKey(new Date(year, month, day)) === makeDateKey(today);
  };

  // Check if a day is selected
  const isSelected = (day) => {
    if (!day) return false;

    return (
      makeDateKey(new Date(year, month, day)) === selectedDate
    );
  };

  // Display a useful reminder message
  const getReminderText = (daysLeft) => {
    if (daysLeft === 0) return "Today";
    if (daysLeft === 1) return "Tomorrow";

    return `In ${daysLeft} days`;
  };

  return (
    <section className="renewal-calendar-section">
      <div className="renewal-calendar-heading">
        <div>
          <span className="calendar-eyebrow">STAY PREPARED</span>
          <h3>Renewal calendar</h3>
          <p>
            Keep track of upcoming payments and free-trial expiry dates.
          </p>
        </div>

        <div className="calendar-heading-icon">
          <CalendarDays size={23} />
        </div>
      </div>

      <div className="renewal-calendar-layout">

        {/* Calendar */}
        <div className="calendar-main">

          <div className="calendar-navigation">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft size={19} />
            </button>

            <h4>
              {currentMonth.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </h4>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight size={19} />
            </button>
          </div>

          <div className="calendar-grid">

            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
              (day) => (
                <div className="calendar-weekday" key={day}>
                  {day}
                </div>
              )
            )}

            {calendarCells.map((day, index) => {
              const dateKey = day
                ? makeDateKey(new Date(year, month, day))
                : "";

              const dayEvents = dateKey
                ? eventsByDate[dateKey] || []
                : [];

              const hasRenewal = dayEvents.some(
                (event) => event.type === "renewal"
              );

              const hasTrial = dayEvents.some(
                (event) => event.type === "trial"
              );

              return (
                <button
                  type="button"
                  key={`${year}-${month}-${index}`}
                  className={[
                    "calendar-day",
                    !day ? "calendar-empty" : "",
                    isToday(day) ? "calendar-today" : "",
                    isSelected(day) ? "calendar-selected" : "",
                    dayEvents.length ? "calendar-has-event" : "",
                  ].join(" ")}
                  disabled={!day}
                  onClick={() => selectDate(day)}
                  aria-label={
                    day
                      ? `${formatDate(dateKey)}, ${dayEvents.length} events`
                      : "Empty calendar cell"
                  }
                >
                  {day && (
                    <>
                      <span className="calendar-day-number">{day}</span>

                      <span className="calendar-event-dots">
                        {hasRenewal && (
                          <span className="calendar-dot renewal-dot" />
                        )}

                        {hasTrial && (
                          <span className="calendar-dot trial-dot" />
                        )}
                      </span>
                    </>
                  )}
                </button>
              );
            })}

          </div>

          <div className="calendar-legend">
            <span>
              <i className="calendar-dot renewal-dot" />
              Renewal
            </span>

            <span>
              <i className="calendar-dot trial-dot" />
              Trial expiry
            </span>
          </div>

          {/* Selected date events */}
          <div className="selected-date-events">
            <div className="selected-date-heading">
              <CalendarDays size={17} />
              <h4>{formatDate(selectedDate)}</h4>
            </div>

            {selectedEvents.length === 0 ? (
              <p className="no-calendar-events">
                No scheduled events on this date.
              </p>
            ) : (
              <div className="calendar-event-list">
                {selectedEvents.map((event) => (
                  <div className="calendar-event-item" key={event.id}>
                    <div
                      className={`calendar-event-icon ${event.type}`}
                    >
                      {event.type === "renewal" ? (
                        <CreditCard size={17} />
                      ) : (
                        <Gift size={17} />
                      )}
                    </div>

                    <div className="calendar-event-details">
                      <strong>{event.name}</strong>
                      <span>
                        {event.type === "renewal"
                          ? "Subscription renewal"
                          : "Free trial expires"}
                      </span>
                    </div>

                    {event.type === "renewal" && (
                      <strong className="calendar-event-amount">
                        ₹{event.amount.toLocaleString("en-IN")}
                      </strong>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming reminders */}
        <aside className="upcoming-reminders">

          <div className="reminders-heading">
            <div>
              <span className="calendar-eyebrow">NEXT 30 DAYS</span>
              <h4>Upcoming reminders</h4>
            </div>

            <Bell size={20} />
          </div>

          <p className="reminders-description">
            Your next scheduled subscription events.
          </p>

          {upcomingEvents.length === 0 ? (
            <div className="no-upcoming-reminders">
              <CalendarDays size={27} />
              <p>No upcoming renewals or trial expiries in the next 30 days.</p>
            </div>
          ) : (
            <div className="upcoming-reminder-list">
              {upcomingEvents.map((event) => (
                <button
                  type="button"
                  className="upcoming-reminder-item"
                  key={event.id}
                  onClick={() => {
                    setCurrentMonth(() => {
                      const [eventYear, eventMonth] = event.date
                        .split("-")
                        .map(Number);

                      return new Date(eventYear, eventMonth - 1, 1);
                    });

                    setSelectedDate(event.date);
                  }}
                >
                  <div
                    className={`reminder-type-icon ${event.type}`}
                  >
                    {event.type === "renewal" ? (
                      <CreditCard size={17} />
                    ) : (
                      <Gift size={17} />
                    )}
                  </div>

                  <div className="reminder-item-content">
                    <strong>{event.name}</strong>

                    <span>
                      {event.type === "renewal"
                        ? "Renewal"
                        : "Trial expiry"}
                    </span>

                    <small>
                      {formatDate(event.date)}
                    </small>
                  </div>

                  <div className="reminder-time">
                    <Clock3 size={13} />
                    <span>{getReminderText(event.daysLeft)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

        </aside>
      </div>

      <div className="calendar-disclaimer">
        <Bell size={15} />
        <p>
          These are in-app schedule indicators, not automatic notifications.
          Email and push reminders will be added with the backend.
        </p>
      </div>
    </section>
  );
}

export default RenewalCalendar;
