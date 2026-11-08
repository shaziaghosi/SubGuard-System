
import { useMemo } from "react";
import {
  TrendingUp,
  Wallet,
  CreditCard,
  Gift,
  PieChart,
  ArrowUpRight,
} from "lucide-react";
import "./SubscriptionInsights.css";

function SubscriptionInsights({ subscriptions = [] }) {
  const insights = useMemo(() => {
    const active = subscriptions.filter(
      (sub) => (sub.status || "Active") === "Active"
    );

    const paused = subscriptions.filter(
      (sub) => (sub.status || "Active") === "Paused"
    );

    const cancelled = subscriptions.filter(
      (sub) => (sub.status || "Active") === "Cancelled"
    );

    const getMonthlyCost = (sub) => {
      const amount = Number(sub.amount) || 0;

      switch (sub.billingCycle || "Monthly") {
        case "Weekly":
          return (amount * 52) / 12;
        case "Quarterly":
          return amount / 3;
        case "Yearly":
          return amount / 12;
        default:
          return amount;
      }
    };

    const monthlyTotal = active.reduce(
      (total, sub) => total + getMonthlyCost(sub),
      0
    );

    const yearlyTotal = monthlyTotal * 12;

    const categoryTotals = active.reduce((totals, sub) => {
      const category = sub.category || "Other";
      totals[category] =
        (totals[category] || 0) + getMonthlyCost(sub);
      return totals;
    }, {});

    const topSubscriptions = [...active]
      .sort((a, b) => getMonthlyCost(b) - getMonthlyCost(a))
      .slice(0, 5);

    const freeTrials = active.filter((sub) => sub.isFreeTrial);

    const trialMonthlyExposure = freeTrials.reduce(
      (total, sub) => total + getMonthlyCost(sub),
      0
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const trialsEndingSoon = freeTrials.filter((sub) => {
      if (!sub.trialEndDate) return false;

      const [year, month, day] = sub.trialEndDate.split("-").map(Number);
      const expiry = new Date(year, month - 1, day);
      const difference = Math.round(
        (expiry.getTime() - today.getTime()) / 86400000
      );

      return difference >= 0 && difference <= 7;
    });

    return {
      activeCount: active.length,
      pausedCount: paused.length,
      cancelledCount: cancelled.length,
      monthlyTotal,
      yearlyTotal,
      categoryTotals,
      topSubscriptions,
      freeTrialCount: freeTrials.length,
      trialMonthlyExposure,
      trialsEndingSoon: trialsEndingSoon.length,
      getMonthlyCost,
    };
  }, [subscriptions]);

  const formatMoney = (amount) =>
    `₹${amount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const categoryEntries = Object.entries(insights.categoryTotals)
    .sort((a, b) => b[1] - a[1]);

  const largestCategory = Math.max(
    0,
    ...categoryEntries.map(([, amount]) => amount)
  );

  return (
    <section className="insights-section">
      <div className="insights-heading">
        <div>
          <span className="insights-eyebrow">YOUR SUBSCRIPTION DATA</span>
          <h3>Subscription Insights</h3>
          <p>Understand your recurring costs and spending patterns.</p>
        </div>

        <div className="insights-heading-icon">
          <TrendingUp size={22} />
        </div>
      </div>

      {/* Spending overview */}
      <div className="insights-overview">
        <div className="insight-card">
          <div className="insight-card-top">
            <span>Monthly spending</span>
            <Wallet size={19} />
          </div>
          <h4>{formatMoney(insights.monthlyTotal)}</h4>
          <p>Estimated cost across active subscriptions</p>
        </div>

        <div className="insight-card">
          <div className="insight-card-top">
            <span>Yearly projection</span>
            <TrendingUp size={19} />
          </div>
          <h4>{formatMoney(insights.yearlyTotal)}</h4>
          <p>Estimated monthly cost × 12</p>
        </div>

        <div className="insight-card">
          <div className="insight-card-top">
            <span>Active subscriptions</span>
            <CreditCard size={19} />
          </div>
          <h4>{insights.activeCount}</h4>
          <p>
            {insights.pausedCount} paused · {insights.cancelledCount} cancelled
          </p>
        </div>
      </div>

      {/* Category spending */}
      <div className="insights-panel">
        <div className="insights-panel-heading">
          <div>
            <span className="insights-eyebrow">WHERE YOUR MONEY GOES</span>
            <h4>Category spending</h4>
          </div>
          <PieChart size={20} />
        </div>

        {categoryEntries.length === 0 ? (
          <p className="insights-empty">
            Add active subscriptions to see your category spending.
          </p>
        ) : (
          <div className="insights-category-list">
            {categoryEntries.map(([category, amount]) => {
              const percentage =
                insights.monthlyTotal > 0
                  ? (amount / insights.monthlyTotal) * 100
                  : 0;

              return (
                <div className="insights-category" key={category}>
                  <div className="insights-category-info">
                    <span>{category}</span>
                    <strong>{formatMoney(amount)}</strong>
                  </div>

                  <div className="insights-progress-track">
                    <div
                      className="insights-progress-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <span className="insights-percentage">
                    {percentage.toFixed(1)}% of monthly spending
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Most expensive subscriptions */}
      <div className="insights-panel">
        <div className="insights-panel-heading">
          <div>
            <span className="insights-eyebrow">COST BREAKDOWN</span>
            <h4>Highest-cost subscriptions</h4>
          </div>
          <ArrowUpRight size={20} />
        </div>

        {insights.topSubscriptions.length === 0 ? (
          <p className="insights-empty">
            Your active subscriptions will appear here.
          </p>
        ) : (
          <div className="insights-top-list">
            {insights.topSubscriptions.map((sub, index) => (
              <div className="insights-top-item" key={sub.name}>
                <div className="insights-rank">{index + 1}</div>

                <div className="insights-top-name">
                  <strong>{sub.name}</strong>
                  <span>{sub.category || "Other"}</span>
                </div>

                <div className="insights-top-cost">
                  <strong>{formatMoney(insights.getMonthlyCost(sub))}</strong>
                  <span>/ month equivalent</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Free trial exposure */}
      <div className="insights-trial-panel">
        <div className="insights-trial-icon">
          <Gift size={22} />
        </div>

        <div className="insights-trial-content">
          <span className="insights-eyebrow">FREE TRIAL WATCH</span>
          <h4>{insights.freeTrialCount} active free trials</h4>
          <p>
            Potential monthly cost if all these trials convert:
            {" "}
            <strong>{formatMoney(insights.trialMonthlyExposure)}</strong>
          </p>
          <p>
            {insights.trialsEndingSoon} trial(s) ending within the next 7 days.
          </p>
        </div>
      </div>

      <p className="insights-disclaimer">
        These are estimates based on the amounts and billing cycles entered.
        Trial exposure is a projection, not a confirmed future charge.
      </p>
    </section>
  );
}

export default SubscriptionInsights;
