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
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="home-container">
        <main className="home-main">
          <section className="hero-section">
            <div className="hero-content">
              <h2>Welcome to Reflecta</h2>
              <p>
                Set your goals, log your day, track your progress, and achieve
                your dreams. Start your journey with us today.
              </p>
              <div className="hero-actions">
                <Link to="/signup" className="cta-button">
                  Get Started
                </Link>
                <Link to="/login" className="secondary-button">
                  Login
                </Link>
              </div>
            </div>
          </section>

          <section className="features-section">
            <div className="features-content">
              <div className="features-grid">
                <div className="feature-item">
                  <div className="feature-icon">🎯</div>
                  <h4>Goal Setting</h4>
                  <p>Set personal goals and work towards achieving them.</p>
                  <div className="feature-hint">Login to access</div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">📝</div>
                  <h4>Journal Writing</h4>
                  <p>
                    Record and reflect on your daily experiences and thoughts.
                  </p>
                  <div className="feature-hint">Login to access</div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">📊</div>
                  <h4>Progress Tracking</h4>
                  <p>Visualize your growth journey and track your progress.</p>
                  <div className="feature-hint">Login to access</div>
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
  }

  return (
    <div className="home-container">
      <main className="home-main">
        <section className="hero-section">
          <div className="hero-content">
            <h2>About Reflecta</h2>
            <p className="about-intro">
              Welcome, {user?.name || "there"}! Reflecta is your personal growth
              companion, designed to help you set meaningful goals, reflect on
              your journey, and track your progress towards becoming your best
              self.
            </p>
          </div>
        </section>

        <section className="features-section">
          <div className="features-content">
            <h3 className="section-title">What You Can Do</h3>
            <div className="features-grid">
              <div
                className="feature-item clickable"
                onClick={handleGoalSettingClick}
              >
                <div className="feature-icon">🎯</div>
                <h4>Goal Setting</h4>
                <p>
                  Set personal goals and work towards achieving them with
                  structured planning and tracking.
                </p>
                <div className="feature-hint">Click to set your goals</div>
              </div>
              <div
                className="feature-item clickable"
                onClick={handleJournalClick}
              >
                <div className="feature-icon">📝</div>
                <h4>Journal Writing</h4>
                <p>
                  Record and reflect on your daily experiences, thoughts, and
                  feelings with AI-powered assistance.
                </p>
                <div className="feature-hint">Click to start writing</div>
              </div>
              <div
                className="feature-item clickable"
                onClick={handleProgressClick}
              >
                <div className="feature-icon">📊</div>
                <h4>Progress Dashboard</h4>
                <p>
                  Visualize your growth journey and track your progress with
                  insightful analytics.
                </p>
                <div className="feature-hint">Click to view dashboard</div>
              </div>
            </div>

            <div className="about-mission">
              <h3>Our Mission</h3>
              <p>
                We believe that self-reflection and goal-setting are powerful
                tools for personal growth. Reflecta combines modern technology
                with proven psychological principles to create a platform that
                supports your journey towards self-improvement and achievement.
              </p>
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
