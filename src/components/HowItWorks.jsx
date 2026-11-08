import { motion } from "framer-motion";
import { PlusCircle, ShieldAlert, BellRing } from "lucide-react";
import "./HowItWorks.css";

// Each object represents one step in the SubGuard process.
const steps = [
  {
    number: "01",
    icon: PlusCircle,
    title: "Add a Subscription",
    description:
      "Enter your subscription details, billing amount, and next renewal date.",
  },
  {
    number: "02",
    icon: ShieldAlert,
    title: "Understand the Risk",
    description:
      "Spot upcoming renewals, forgotten free trials, and recurring charges.",
  },
  {
    number: "03",
    icon: BellRing,
    title: "Stay in Control",
    description:
      "Get reminders before renewal dates so you have time to take action.",
  },
];

function HowItWorks() {
  return (
    <section className="how-section" id="how-it-works">
      <div className="how-container">
        <p className="how-eyebrow">SIMPLE BY DESIGN</p>

        <h2 className="how-heading">
          Three steps.
          <br />
          <span>More control.</span>
        </h2>

        <p className="how-intro">
          Staying ahead of recurring payments shouldn't be complicated.
        </p>

        <div className="how-grid">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.article
                className="how-card"
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.12,
                }}
              >
                <div className="how-card-top">
                  <span>{step.number}</span>
                  <Icon size={27} strokeWidth={1.6} />
                </div>

                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;