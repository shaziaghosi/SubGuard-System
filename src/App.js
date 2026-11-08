
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/NavbarTemp.jsx";
import Hero from "./components/HeroTemp.jsx";
import ProblemSection from "./components/ProblemSection.jsx";
import HowItWorks from "./components/HowItWorks.jsx";
import DashboardPreview from "./components/DashboardPreview.jsx";
import Footer from "./components/Footer.jsx";

import Login from "./pages/login";
import Register from "./pages/register";
import { useAuth } from "./context/AuthContext";

import "./App.css";

// Existing SubGuard landing page
function Home() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <ProblemSection />
        <DashboardPreview />
      </main>
      <Footer />
    </div>
  );
}

// Prevent access to protected pages without login
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Loading SubGuard...</p>;
  }

  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPreview />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


