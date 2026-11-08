import "./Hero.css";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Play,
  BellRing,
  ShieldCheck,
  CircleDollarSign,
  CalendarClock,
} from "lucide-react";
import "./Hero.css";

function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-glow hero-glow-one" />
      <div className="hero-glow hero-glow-two" />

      <div className="hero-content">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="eyebrow">THE SMART SUBSCRIPTION GUARD</p>

          <h1>
            Don’t let small payments become{" "}
            <span>big commitments.</span>
          </h1>

          <p className="hero-description">
            Understand the real cost, recurring terms and hidden
            conditions of any subscription — before you subscribe.
          </p>

          <div className="hero-buttons">
            <a href="#analyzer" className="primary-cta">
              Analyze a Subscription <ArrowRight size={18} />
            </a>

            <a href="#how-it-works" className="secondary-cta">
              <span className="play-icon"><Play size={16} /></span>
              Watch how it works
            </a>
          </div>

          <div className="hero-benefits">
            <span><CircleDollarSign size={18} /> See the real cost</span>
            <span><BellRing size={18} /> Detect auto-renewals</span>
            <span><ShieldCheck size={18} /> Make smarter choices</span>
          </div>
        </motion.div>

        <motion.div
          className="hero-preview"
          initial={{ opacity: 0, y: 35, rotateY: -8 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <div className="preview-orbit" />

          <div className="subscription-card">
            <div className="preview-top">
              <div className="service-icon">N</div>
              <div>
                <h3>Premium Plan</h3>
                <p>Entertainment subscription</p>
              </div>
            </div>

            <div className="monthly-price">
              <strong>₹199</strong><span>/ month</span>
            </div>

            <div className="yearly-cost">
              <p>YOUR REAL COMMITMENT</p>
              <strong>₹2,388 <small>/ year</small></strong>
              <span>₹7,164 over 3 years</span>
            </div>

            <div className="preview-detail">
              <CalendarClock size={16} />
              <span>Automatic renewal</span>
              <strong>Detected</strong>
            </div>

            <div className="preview-warning">
              <BellRing size={17} />
              <span>Remember to review before your next charge.</span>
            </div>

            <button className="preview-reminder">
              <BellRing size={16} /> Set a reminder
            </button>
          </div>
        </motion.div>
      </div>

      <div className="hero-bottom-line">
        <span>KNOW THE COST.</span>
        <span>UNDERSTAND THE TERMS.</span>
        <span>CHOOSE WITH CONFIDENCE.</span>
      </div>
    </section>
  );
}

export default Hero;
