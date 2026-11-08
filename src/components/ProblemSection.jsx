import { motion } from "framer-motion";
import { Clock, RefreshCw, Wallet } from "lucide-react";
import "./ProblemSection.css";

const problems = [
  {
    icon: Clock,
    number: "01",
    title: "Forgotten Free Trials",
    description:
      "A free trial ends before you remember to cancel, and suddenly you're charged.",
  },
  {
    icon: RefreshCw,
    number: "02",
    title: "Silent Auto-Renewals",
    description:
      "Subscriptions renew automatically, even when you no longer need the service.",
  },
  {
    icon: Wallet,
    number: "03",
    title: "The Hidden Long-Term Cost",
    description:
      "Small monthly payments can add up to a surprising amount over time.",
  },
];

function ProblemSection() {
  return (
    <section className="problem-section" id="features">
      <div className="problem-container">

        {/* Small label above the main heading */}
        <p className="problem-eyebrow">THE SUBSCRIPTION TRAP</p>

        <h2 className="problem-heading">
          Small payments.
          <br />
          <span>Big consequences.</span>
        </h2>

        <p className="problem-intro">
          It's easy to subscribe. It's even easier to forget.
          SubGuard helps you stay one step ahead of recurring charges.
        </p>

        {/* Render one card for every problem in our array */}
        <div className="problem-grid">
          {problems.map((problem, index) => {
            const Icon = problem.icon;

            return (
              <motion.article
                className="problem-card"
                key={problem.number}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <div className="problem-card-top">
                  <span className="problem-number">
                    {problem.number}
                  </span>

                  <Icon size={25} strokeWidth={1.6} />
                </div>

                <h3>{problem.title}</h3>
                <p>{problem.description}</p>
              </motion.article>
            );
          })}
        </div>

        <p className="problem-bottom-line">
          Know what’s coming. Take control before you’re charged.
        </p>
      </div>
    </section>
  );
}

export default ProblemSection;