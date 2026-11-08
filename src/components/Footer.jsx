
import "./Footer.css";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

function Footer() {
  return (
    <footer className="footer" id='about'>
      {/* Top call-to-action banner */}
      <div className="footer-cta">
        <div>
          <p className="footer-eyebrow">STAY ONE STEP AHEAD</p>
          <h2>Take control before your next renewal.</h2>
          <p>
            Keep track of subscriptions and make more informed decisions
            before recurring payments catch you off guard.
          </p>
        </div>

        <a href="#dashboard" className="footer-cta-button">
          Explore SubGuard <ArrowUpRight size={18} />
        </a>
      </div>

      {/* Footer navigation columns */}
      <div className="footer-main">
        <div className="footer-brand">
          <div className="footer-logo">
            <ShieldCheck size={25} />
            <span>SubGuard</span>
          </div>

          <p>
            Your subscriptions. Your decisions.
            Stay aware of every renewal.
          </p>
        </div>

        <div className="footer-column">
          <h3>Main</h3>
          <a href="#home">Home</a>
          <a href="#problem">The Problem</a>
          <a href="#how-it-works">How It Works</a>
        </div>

        <div className="footer-column">
          <h3>Explore</h3>
          <a href="#dashboard">Dashboard Preview</a>
          <a href="#how-it-works">Features</a>
        </div>

        <div className="footer-column">
          <h3>Legal</h3>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
        </div>

        <div className="footer-column">
          <h3>Connect</h3>
          <a href="mailto:hello@subguard.example">Email Us</a>
          <a href="#about">About SubGuard</a>
        </div>
      </div>

      {/* Bottom copyright line */}
      <div className="footer-bottom">
        <p>© 2026 SubGuard. All rights reserved.</p>
        <p>Built to help you stay in control.</p>
      </div>
    </footer>
  );
}

export default Footer;
