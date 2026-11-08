import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import RenewalCalendar from "./RenewalCalendar";
import SubscriptionInsights from "./SubscriptionInsights";
import ReminderSettings from "./ReminderSettings";
import {
  CalendarDays,
  CircleAlert,
  ArrowUpRight,
  CheckCircle2,
  Trash2,
  Pencil,
  PauseCircle,
  PlayCircle,
  XCircle,
} from "lucide-react";
import {
  getSubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription,
} from "../services/subscriptionServices";

import "./DashboardPreview.css";

function DashboardPreview() {
  // Load saved subscriptions and support older saved records
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState("");


  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "Entertainment",
    amount: "",
    billingCycle: "Monthly", 
    isFreeTrial: false,
    trialEndDate: "",
    renewal: "",
    cancelUrl: "",
  });

  const [editingId, setEditingId] = useState(null);
  // Search, filter and sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [lifecycleFilter, setLifecycleFilter] = useState("All");
  const [billingFilter, setBillingFilter] = useState("All");
  const [renewalFilter, setRenewalFilter] = useState("All");
  const [sortBy, setSortBy] = useState("renewal-asc");

   
// Convert MongoDB subscription fields into dashboard fields
const formatSubscription = (subscription) => ({
  ...subscription,
  id: subscription._id,
  name: subscription.serviceName,
  amount: subscription.cost,
  renewal: subscription.nextRenewalDate
    ? String(subscription.nextRenewalDate).split("T")[0]
    : "",
  trialEndDate: subscription.trialEndDate
    ? String(subscription.trialEndDate).split("T")[0]
    : "",
  status: subscription.status || "Active",
  cancelUrl: subscription.cancelUrl || "",
  reminderEnabled: subscription.reminderEnabled ?? true,
  reminderDays: subscription.reminderDays ?? 3,
});

// Load subscriptions from MongoDB
useEffect(() => {
  const loadSubscriptions = async () => {
    try {
      setLoadingSubscriptions(true);
      setSubscriptionError("");

      const response = await getSubscriptions();

      const records =
        Array.isArray(response) ? response :
        Array.isArray(response.subscriptions) ? response.subscriptions :
        Array.isArray(response.data) ? response.data : [];

      setSubscriptions(records.map(formatSubscription));
    } catch (error) {
      console.error("Error loading subscriptions:", error);

      setSubscriptionError(
        error.response?.data?.message ||
        "Unable to load subscriptions. Please try again."
      );
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  loadSubscriptions();
}, []);


  // Today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not selected";

    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Calculate monthly equivalent cost
  const getMonthlyCost = (subscription) => {
    const amount = Number(subscription.amount) || 0;

    switch (subscription.billingCycle || "Monthly") {
      case "Weekly":
        return (amount * 52) / 12;
      case "Quarterly":
        return amount / 3;
      case "Yearly":
        return amount / 12;
      case "Monthly":
      default:
        return amount;
    }
  };

  // Calculate days between today and a date
  const getDaysDifference = (dateString) => {
    if (!dateString) return null;

    const [year, month, day] = dateString.split("-").map(Number);
    const targetDate = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Math.round(
      (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  };

  // Get renewal status
  const getRenewalStatus = (renewalDate) => {
    const difference = getDaysDifference(renewalDate);

    if (difference === null) return "Upcoming";
    if (difference < 0) return "Overdue";
    if (difference <= 7) return "Due Soon";

    return "Upcoming";
  };

  // Get free trial status
  const getTrialStatus = (trialEndDate) => {
    const difference = getDaysDifference(trialEndDate);

    if (difference === null) return "";

    if (difference < 0) return "Trial Expired";
    if (difference === 0) return "Trial Ends Today";
    if (difference <= 7) return "Trial Ending Soon";

    return "Free Trial";
  };

  // Validate cancellation URL
  const isValidCancelUrl = (url) => {
    if (!url.trim()) return true;

    try {
      const parsedUrl = new URL(url.trim());

      return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
    } catch {
      return false;
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      category: "Entertainment",
      amount: "",
      billingCycle: "Monthly",
      isFreeTrial: false,
      trialEndDate: "",
      renewal: "",
      cancelUrl: "",
    });

    setEditingId(null);
  };

  // Add or update subscription in MongoDB
const handleSubmit = async (event) => {
  event.preventDefault();

  const trimmedName = formData.name.trim();
  const amount = Number(formData.amount);
  const cancelUrl = formData.cancelUrl.trim();

  if (!trimmedName) {
    alert("Please enter a subscription name.");
    return;
  }

  if (formData.amount === "" || !Number.isFinite(amount) || amount < 0) {
    alert("Please enter a valid subscription amount.");
    return;
  }

  if (!formData.isFreeTrial && amount === 0) {
    alert("Please enter a valid subscription amount.");
    return;
  }

  if (!formData.renewal) {
    alert("Please select the next renewal date.");
    return;
  }

  if (formData.isFreeTrial && !formData.trialEndDate) {
    alert("Please select the free trial expiry date.");
    return;
  }

  if (
    formData.isFreeTrial &&
    getDaysDifference(formData.trialEndDate) < 0
  ) {
    alert("Trial expiry date cannot be in the past.");
    return;
  }

  if (!isValidCancelUrl(cancelUrl)) {
    alert(
      "Please enter a valid cancellation URL starting with http:// or https://."
    );
    return;
  }

  const normalizedName = trimmedName.toLowerCase();

  const duplicateExists = subscriptions.some(
    (subscription) =>
      subscription.name.trim().toLowerCase() === normalizedName &&
      subscription.id !== editingId
  );

  if (duplicateExists) {
    alert("This subscription already exists.");
    return;
  }

  const existingSubscription = subscriptions.find(
    (subscription) => subscription.id === editingId
  );

  const subscriptionData = {
    serviceName: trimmedName,
    category: formData.category,
    cost: amount,
    currency: "INR",
    billingCycle: formData.billingCycle,
    nextRenewalDate: formData.renewal,
    isFreeTrial: formData.isFreeTrial,
    trialEndDate: formData.isFreeTrial
      ? formData.trialEndDate
      : null,
    cancelUrl,
    status: existingSubscription?.status || "Active",
    reminderEnabled: existingSubscription?.reminderEnabled ?? true,
    reminderDays: existingSubscription?.reminderDays ?? 3,
  };

  try {
    if (editingId !== null) {
      await updateSubscription(editingId, subscriptionData);
    } else {
      await addSubscription(subscriptionData);
    }

    // Reload the latest records from MongoDB
    const response = await getSubscriptions();

    const records =
      Array.isArray(response) ? response :
      Array.isArray(response.subscriptions) ? response.subscriptions :
      Array.isArray(response.data) ? response.data : [];

    setSubscriptions(records.map(formatSubscription));

    resetForm();

    alert(
      editingId !== null
        ? "Subscription updated successfully!"
        : "Subscription added successfully!"
    );
  } catch (error) {
    console.error("Subscription save error:", error);

    alert(
      error.response?.data?.message ||
      "Unable to save subscription. Please try again."
    );
  }
};


// Edit subscription
const handleEdit = (subscription) => {
  setEditingId(subscription.id);

  setFormData({
    name: subscription.name,
    category: subscription.category || "Other",
    amount: String(subscription.amount ?? ""),
    billingCycle: subscription.billingCycle || "Monthly",
    isFreeTrial: subscription.isFreeTrial || false,
    trialEndDate: subscription.trialEndDate || "",
    renewal: subscription.renewal || "",
    cancelUrl: subscription.cancelUrl || "",
  });

  document.querySelector(".subscription-form")?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
};

// Delete subscription permanently from MongoDB
const handleDelete = async (subscription) => {
  const shouldDelete = window.confirm(
    `Permanently delete ${subscription.name} from your dashboard?`
  );

  if (!shouldDelete) return;

  try {
    await deleteSubscription(subscription.id);

    setSubscriptions((currentSubscriptions) =>
      currentSubscriptions.filter(
        (item) => item.id !== subscription.id
      )
    );

    if (editingId === subscription.id) {
      resetForm();
    }

    alert("Subscription deleted successfully!");
  } catch (error) {
    console.error("Delete subscription error:", error);

    alert(
      error.response?.data?.message ||
      "Unable to delete subscription."
    );
  }
};

const handleStatusChange = async (subscriptionId, newStatus) => {
  try {
    await updateSubscription(subscriptionId, {
      status: newStatus,
    });

    const response = await getSubscriptions();

    const records =
      Array.isArray(response) ? response :
      Array.isArray(response.subscriptions) ? response.subscriptions :
      Array.isArray(response.data) ? response.data : [];

    setSubscriptions(records.map(formatSubscription));
  } catch (error) {
    console.error("Status update error:", error);

    alert(
      error.response?.data?.message ||
      "Unable to update subscription status."
    );
  }
};
// Update reminder preferences in MongoDB
const handleReminderSettingsChange = async (subscriptionId, updates) => {
  try {
    await updateSubscription(subscriptionId, updates);

    const response = await getSubscriptions();

    const records =
      Array.isArray(response) ? response :
      Array.isArray(response.subscriptions) ? response.subscriptions :
      Array.isArray(response.data) ? response.data : [];

    setSubscriptions(records.map(formatSubscription));
  } catch (error) {
    console.error("Reminder update error:", error);

    alert(
      error.response?.data?.message ||
      "Unable to update reminder settings."
    );
  }
};
  // Only active subscriptions count towards spending and alerts
  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "Active",
  );

  const pausedCount = subscriptions.filter(
    (subscription) => subscription.status === "Paused",
  ).length;

  const cancelledCount = subscriptions.filter(
    (subscription) => subscription.status === "Cancelled",
  ).length;

  const activeCount = activeSubscriptions.length;

  // Renewal counts for active subscriptions only
  const dueSoonCount = activeSubscriptions.filter(
    (subscription) => getRenewalStatus(subscription.renewal) === "Due Soon",
  ).length;

  const overdueCount = activeSubscriptions.filter(
    (subscription) => getRenewalStatus(subscription.renewal) === "Overdue",
  ).length;

  const upcomingCount = activeSubscriptions.filter(
    (subscription) => getRenewalStatus(subscription.renewal) === "Upcoming",
  ).length;

  // Active free trials ending soon
  const trialEndingCount = activeSubscriptions.filter((subscription) => {
    if (!subscription.isFreeTrial) return false;

    const status = getTrialStatus(subscription.trialEndDate);

    return status === "Trial Ending Soon" || status === "Trial Ends Today";
  }).length;

  // Count subscriptions needing attention only once
  const attentionCount = activeSubscriptions.filter((subscription) => {
    const renewalStatus = getRenewalStatus(subscription.renewal);

    const trialStatus = subscription.isFreeTrial
      ? getTrialStatus(subscription.trialEndDate)
      : "";

    return (
      renewalStatus === "Due Soon" ||
      renewalStatus === "Overdue" ||
      trialStatus === "Trial Ending Soon" ||
      trialStatus === "Trial Ends Today"
    );
  }).length;

  // Monthly spending from active subscriptions only
  const monthlyTotal = activeSubscriptions.reduce(
    (total, subscription) => total + getMonthlyCost(subscription),
    0,
  );

  // Category spending from active subscriptions only
  const categoryTotals = activeSubscriptions.reduce((totals, subscription) => {
    const category = subscription.category || "Other";
    const monthlyCost = getMonthlyCost(subscription);

    totals[category] = (totals[category] || 0) + monthlyCost;

    return totals;
  }, {});

  const totalCategorySpending = Object.values(categoryTotals).reduce(
    (total, amount) => total + amount,
    0,
  );
  // Search, filter and sort subscriptions
  const categories = [
    ...new Set(
      subscriptions.map((subscription) => subscription.category || "Other"),
    ),
  ].sort();

  const filteredSubscriptions = subscriptions
    .filter((subscription) => {
      const status = subscription.status || "Active";

      const matchesSearch = subscription.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase().trim());

      const matchesCategory =
        categoryFilter === "All" ||
        (subscription.category || "Other") === categoryFilter;

      const matchesLifecycle =
        lifecycleFilter === "All" || status === lifecycleFilter;

      const matchesBilling =
        billingFilter === "All" ||
        (subscription.billingCycle || "Monthly") === billingFilter;

      const matchesRenewal =
        renewalFilter === "All" ||
        (status === "Active" &&
          getRenewalStatus(subscription.renewal) === renewalFilter);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesLifecycle &&
        matchesBilling &&
        matchesRenewal
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);

        case "amount-asc":
          return Number(a.amount) - Number(b.amount);

        case "amount-desc":
          return Number(b.amount) - Number(a.amount);

        case "renewal-asc":
          return (a.renewal || "9999-12-31").localeCompare(
            b.renewal || "9999-12-31",
          );

        case "renewal-desc":
          return (b.renewal || "").localeCompare(a.renewal || "");

        default:
          return 0;
      }
    });

  // Reset all search and filter controls
  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("All");
    setLifecycleFilter("All");
    setBillingFilter("All");
    setRenewalFilter("All");
    setSortBy("renewal-asc");
  };

  return (
    <section className="dashboard-section" id="features">
      <div className="dashboard-container">
        {/* Dashboard Heading */}
        <div className="dashboard-heading">
          <p className="dashboard-eyebrow">YOUR MONEY, YOUR CONTROL</p>

          <h2>
            See what's coming.
            <br />
            <span>Stay one step ahead.</span>
          </h2>

          <p>
            One clear view of your recurring payments, upcoming renewals, and
            the charges you don't want to forget.
          </p>
        </div>

        {/* Dashboard Panel */}
        <motion.div
          className="dashboard-panel"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6 }}
        >
          {loadingSubscriptions && (
  <p className="dashboard-message">
    Loading your subscriptions...
  </p>
)}

{subscriptionError && (
  <p className="dashboard-error">
    {subscriptionError}
  </p>
)}
          {/* Top Bar */}
          <div className="dashboard-topbar">
            <div>
              <span className="dashboard-live-dot" />
              <span>SUBGUARD OVERVIEW</span>
            </div>

            <span className="dashboard-demo-label">DEMO PREVIEW</span>
          </div>

          {/* Summary Cards */}
          <div className="dashboard-stats">
            <div className="dashboard-stat">
              <span>Monthly commitments</span>

              <h3>
                ₹
                {monthlyTotal.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}
              </h3>

              <p>Across {activeCount} active subscriptions</p>
            </div>

            <div className="dashboard-stat">
              <span>Upcoming renewals</span>

              <h3>{upcomingCount}</h3>

              <p>
                {dueSoonCount} due soon · {overdueCount} overdue
              </p>
            </div>

            <div className="dashboard-stat dashboard-alert-stat">
              <span>Needs attention</span>

              <h3>{attentionCount}</h3>

              <p>
                {trialEndingCount} trial alerts · {overdueCount} overdue
              </p>
            </div>
          </div>

          {/* Lifecycle Summary */}
          <div className="lifecycle-summary">
            <div className="lifecycle-summary-item">
              <CheckCircle2 size={17} />
              <span>Active</span>
              <strong>{activeCount}</strong>
            </div>

            <div className="lifecycle-summary-item">
              <PauseCircle size={17} />
              <span>Paused</span>
              <strong>{pausedCount}</strong>
            </div>

            <div className="lifecycle-summary-item">
              <XCircle size={17} />
              <span>Cancelled</span>
              <strong>{cancelledCount}</strong>
            </div>
          </div>
          {/* Renewal Calendar and Reminder Centre */}
          <RenewalCalendar subscriptions={subscriptions} />

          <ReminderSettings
            subscriptions={subscriptions}
            onUpdateSubscription={handleReminderSettingsChange}
          />

          {/* Monthly Spending Breakdown */}
          <div className="spending-breakdown">
            <div className="breakdown-heading">
              <div>
                <span className="breakdown-eyebrow">SPENDING ANALYSIS</span>

                <h3>Monthly spending breakdown</h3>

                <p>Only active subscriptions are included.</p>
              </div>

              <div className="breakdown-total">
                <span>Estimated monthly spending</span>

                <strong>
                  ₹
                  {totalCategorySpending.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </strong>
              </div>
            </div>

            {Object.keys(categoryTotals).length === 0 ? (
              <div className="breakdown-empty">
                <p>
                  Your spending breakdown will appear here after adding active
                  subscriptions.
                </p>
              </div>
            ) : (
              <div className="category-breakdown-list">
                {Object.entries(categoryTotals)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, amount]) => {
                    const percentage =
                      totalCategorySpending > 0
                        ? (amount / totalCategorySpending) * 100
                        : 0;

                    return (
                      <div className="category-breakdown-item" key={category}>
                        <div className="category-breakdown-info">
                          <span>{category}</span>

                          <strong>
                            ₹
                            {amount.toLocaleString("en-IN", {
                              maximumFractionDigits: 2,
                            })}
                          </strong>
                        </div>

                        <div className="category-progress-track">
                          <div
                            className="category-progress-fill"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <span className="category-percentage">
                          {percentage.toFixed(1)}% of total spending
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
          {/* Subscription Insights and Analytics */}
          <SubscriptionInsights subscriptions={subscriptions} />

          {/* Add / Edit Subscription Form */}
          <form className="subscription-form" onSubmit={handleSubmit}>
            <h3>
              {editingId !== null
                ? "Edit Subscription"
                : "Add a Subscription"}
            </h3>

            <label htmlFor="service-name">Service name</label>

            <input
              id="service-name"
              type="text"
              placeholder="e.g. Netflix"
              value={formData.name}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  name: event.target.value,
                })
              }
              required
            />

            <label htmlFor="category">Category</label>

            <select
              id="category"
              value={formData.category}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  category: event.target.value,
                })
              }
            >
              <option value="Entertainment">Entertainment</option>
              <option value="Music">Music</option>
              <option value="Utilities">Utilities</option>
              <option value="Education">Education</option>
              <option value="Other">Other</option>
            </select>

            <label htmlFor="amount">Subscription cost (₹)</label>

            <input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 149"
              value={formData.amount}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  amount: event.target.value,
                })
              }
              required
            />

            <label htmlFor="billing-cycle">Billing cycle</label>

            <select
              id="billing-cycle"
              value={formData.billingCycle}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  billingCycle: event.target.value,
                })
              }
            >
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>

            {/* Free Trial */}
            <div className="trial-checkbox">
              <label htmlFor="free-trial">
                <input
                  id="free-trial"
                  type="checkbox"
                  checked={formData.isFreeTrial}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      isFreeTrial: event.target.checked,
                      trialEndDate: event.target.checked
                        ? formData.trialEndDate
                        : "",
                    })
                  }
                />
                This subscription is a free trial
              </label>
            </div>

            {formData.isFreeTrial && (
              <>
                <label htmlFor="trial-end-date">Free trial expiry date</label>

                <input
                  id="trial-end-date"
                  type="date"
                  min={getTodayDate()}
                  value={formData.trialEndDate}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      trialEndDate: event.target.value,
                    })
                  }
                  required
                />
              </>
            )}

            <label htmlFor="renewal-date">Next renewal date</label>

            <input
              id="renewal-date"
              type="date"
              value={formData.renewal}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  renewal: event.target.value,
                })
              }
              required
            />

            <label htmlFor="cancel-url">Cancellation page URL (optional)</label>

            <input
              id="cancel-url"
              type="url"
              placeholder="https://example.com/cancel"
              value={formData.cancelUrl}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  cancelUrl: event.target.value,
                })
              }
            />

            <p className="cancel-url-help">
              Add the official cancellation page for quick access.
            </p>

            <button type="submit">
              {editingId !== null ? "Save Changes" : "Add Subscription"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="cancel-edit-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </form>

          {/* Subscription List Heading */}
          <div className="dashboard-list-heading">
            <h3>All subscriptions</h3>
            <CalendarDays size={19} />
          </div>
          {/* Search, Filter and Sort */}
          <div className="subscription-toolbar">
            <div className="subscription-search">
              <input
                type="text"
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="subscription-filters">
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={lifecycleFilter}
                onChange={(event) => setLifecycleFilter(event.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select
                value={billingFilter}
                onChange={(event) => setBillingFilter(event.target.value)}
              >
                <option value="All">All Billing Cycles</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>

              <select
                value={renewalFilter}
                onChange={(event) => setRenewalFilter(event.target.value)}
              >
                <option value="All">All Renewal Statuses</option>
                <option value="Overdue">Overdue</option>
                <option value="Due Soon">Due Soon</option>
                <option value="Upcoming">Upcoming</option>
              </select>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="renewal-asc">Renewal: Earliest First</option>
                <option value="renewal-desc">Renewal: Latest First</option>
                <option value="name-asc">Name: A–Z</option>
                <option value="amount-asc">Amount: Low to High</option>
                <option value="amount-desc">Amount: High to Low</option>
              </select>
            </div>

            <div className="toolbar-footer">
              <span>
                Showing {filteredSubscriptions.length} of {subscriptions.length}{" "}
                subscriptions
              </span>

              <button type="button" onClick={resetFilters}>
                Reset Filters
              </button>
            </div>
          </div>
          {/* Subscription List */}
          <div className="subscription-list">
            {filteredSubscriptions.length === 0 ? (
              <div className="empty-subscriptions">
                <CalendarDays size={35} />

                <h3>
                  {subscriptions.length === 0
                    ? "No subscriptions added yet"
                    : "No matching subscriptions found"}
                </h3>

                <p>
                  {subscriptions.length === 0
                    ? "Add your first subscription to start tracking recurring payments."
                    : "Try changing your search or filters to find a subscription."}
                </p>

                {subscriptions.length > 0 && (
                  <button type="button" onClick={resetFilters}>
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              filteredSubscriptions.map((subscription, index) => {
                const status = subscription.status || "Active";

                const renewalStatus =
                  status === "Active"
                    ? getRenewalStatus(subscription.renewal)
                    : "";

                const trialStatus =
                  status === "Active" && subscription.isFreeTrial
                    ? getTrialStatus(subscription.trialEndDate)
                    : "";
                return (
                  <motion.div
                    className={`subscription-row lifecycle-${status.toLowerCase()}`}
                    key={subscription.id}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.35,
                      delay: index * 0.1,
                    }}
                  >
                    {/* Subscription Information */}
                    <div className="subscription-info">
                      <div className="subscription-symbol">
                        {subscription.name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <h4>{subscription.name}</h4>
                        <p>{subscription.category}</p>
                      </div>
                    </div>

                    {/* Renewal Date */}
                    <div className="subscription-date">
                      <span>Next renewal</span>
                      <p>{formatDate(subscription.renewal)}</p>
                    </div>

                    {/* Amount */}
                    <div className="subscription-amount">
                      <strong>
                        ₹{Number(subscription.amount).toLocaleString("en-IN")}
                      </strong>

                      <span>/ {subscription.billingCycle || "Monthly"}</span>
                    </div>

                    {/* Lifecycle Status */}
                    <div className={`lifecycle-badge ${status.toLowerCase()}`}>
                      {status === "Active" && <CheckCircle2 size={14} />}
                      {status === "Paused" && <PauseCircle size={14} />}
                      {status === "Cancelled" && <XCircle size={14} />}
                      <span>{status}</span>
                    </div>

                    {/* Renewal Status: Active Only */}
                    {status === "Active" && (
                      <div
                        className={`subscription-status ${renewalStatus
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {renewalStatus === "Overdue" ? (
                          <CircleAlert size={15} />
                        ) : (
                          <CheckCircle2 size={15} />
                        )}

                        <span>{renewalStatus}</span>
                      </div>
                    )}

                    {/* Trial Status */}
                    {status === "Active" && subscription.isFreeTrial && (
                      <div
                        className={`trial-status ${trialStatus
                          .toLowerCase()
                          .replaceAll(" ", "-")}`}
                      >
                        <span>{trialStatus}</span>
                      </div>
                    )}

                    {/* Cancellation Link */}
                    {subscription.cancelUrl && status === "Active" && (
                      <a
                        href={subscription.cancelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cancel-subscription-link"
                      >
                        Cancellation page
                        <ArrowUpRight size={14} />
                      </a>
                    )}

                    {/* Change Lifecycle Status */}
                    <div className="lifecycle-control">
                      <label htmlFor={`status-${index}`}>Manage status</label>

                      <select
                        id={`status-${index}`}
                        value={status}
                        onChange={(event) =>
                          handleStatusChange(
                            subscription.id,
                            event.target.value,
                          )
                        }
                        aria-label={`Change ${subscription.name} status`}
                      >
                        <option value="Active">Active</option>
                        <option value="Paused">Paused</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      className="edit-subscription-btn"
                      onClick={() => handleEdit(subscription)}
                      aria-label={`Edit ${subscription.name}`}
                      title="Edit subscription"
                    >
                      <Pencil size={17} />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      className="delete-subscription-btn"
                      onClick={() => handleDelete(subscription)}
                      aria-label={`Delete ${subscription.name}`}
                      title="Delete subscription"
                    >
                      <Trash2 size={17} />
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>
          {/* Dashboard Note */}
          <div className="dashboard-note">
            <CircleAlert size={18} />
          <p>
            Your subscription records are securely stored in your account.
            SubGuard helps you monitor recurring payments, upcoming renewals,
            and subscription activity. Actual cancellation must still be
            completed through the service provider.
          </p>
            <ArrowUpRight size={17} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default DashboardPreview;
