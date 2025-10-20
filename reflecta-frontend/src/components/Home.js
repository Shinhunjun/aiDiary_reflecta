import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Home.css";

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleJournalClick = () => {
    if (isAuthenticated) {
      navigate("/journal");
    } else {
      navigate("/login");
    }
  };

  const handleGoalSettingClick = () => {
    if (isAuthenticated) {
      navigate("/goal-setting");
    } else {
      navigate("/login");
    }
  };

  const handleProgressClick = () => {
    if (isAuthenticated) {
      navigate("/progress");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="home-container">
      <main className="home-main">
        <section className="hero-section">
          <div className="hero-content">
            <h2>
              {isAuthenticated && user?.name
                ? `Hello, ${user.name}!`
                : "Welcome to Reflecta"}
            </h2>
            <p>
              {isAuthenticated
                ? "Continue your journey of growth and self-discovery."
                : "Set your goals, log your day, track your progress, and achieve your dreams. Start your journey with us today."}
            </p>
            {!isAuthenticated && (
              <div className="hero-actions">
                <Link to="/signup" className="cta-button">
                  Get Started
                </Link>
                <Link to="/login" className="secondary-button">
                  Login
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="features-section">
          <div className="features-content">
            <div className="features-grid">
              <div
                className="feature-item clickable"
                onClick={handleGoalSettingClick}
              >
                <div className="feature-icon">🎯</div>
                <h4>Goal Setting</h4>
                <p>Set personal goals and work towards achieving them.</p>
                <div className="feature-hint">
                  {isAuthenticated
                    ? "Click to set your goals"
                    : "Login to access"}
                </div>
              </div>
              <div
                className="feature-item clickable"
                onClick={handleJournalClick}
              >
                <div className="feature-icon">📝</div>
                <h4>Journal Writing</h4>
                <p>
                  Record and reflect on your daily experiences and thoughts.
                </p>
                <div className="feature-hint">
                  {isAuthenticated
                    ? "Click to start writing"
                    : "Login to access"}
                </div>
              </div>
              <div
                className="feature-item clickable"
                onClick={handleProgressClick}
              >
                <div className="feature-icon">📊</div>
                <h4>Progress Tracking</h4>
                <p>Visualize your growth journey and track your progress.</p>
                <div className="feature-hint">
                  {isAuthenticated
                    ? "Click to review insights"
                    : "Login to access"}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <p>&copy; 2024 Reflecta. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
