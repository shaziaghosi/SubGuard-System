
import { ShieldCheck, Sun, ArrowRight, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <ShieldCheck size={30} strokeWidth={2.4} />
        <span>SubGuard</span>
      </Link>

      <div className={`nav-links ${menuOpen ? "show-menu" : ""}`}>
        <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
        <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
        <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
        <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
      </div>

      <div className="nav-actions">
        <button className="theme-button" aria-label="Theme">
          <Sun size={20} />
        </button>

        {user ? (
          <>
            <Link to="/dashboard" className="login-button">
              Dashboard
            </Link>
            <button className="login-button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="login-button">
              Login
            </Link>
            <Link to="/register" className="get-started">
              Get Started <ArrowRight size={16} />
            </Link>
          </>
        )}
      </div>

      <button
        className="mobile-menu"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <X size={26} /> : <Menu size={26} />}
      </button>
    </nav>
  );
}

export default Navbar;

