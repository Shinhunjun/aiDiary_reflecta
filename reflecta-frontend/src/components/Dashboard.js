import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import GoalSetting from "./GoalSetting";
import "./Dashboard.css";
import "./GoalSetting.css";


const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showGoalSetting, setShowGoalSetting] = useState(false);


  const handleLogout = () => {
    // AuthContext를 통해 로그아웃
    logout();

    alert("Logged out successfully.");
    navigate("/");
  };

  const toggleGoalSetting = () => {
    setShowGoalSetting(!showGoalSetting);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="user-info">
          <span>Hello, {user.name || user.email || "there"}!</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>Welcome!</h2>
          <p>You have successfully logged in.</p>
          <div className="user-details">
            <h3>User Information</h3>
            {user.name && (
              <p>
                <strong>Name:</strong> {user.name}
              </p>
            )}
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>User ID:</strong> {user.id}
            </p>
          </div>
        </div>

        <div className="features-section">
          <h3>Features</h3>
          <div className="features-grid">
            <Link to="/journal" className="feature-card-link">
              <div className="feature-card">
                <h4>📝 Journal Writing</h4>
                <p>
                  Write and reflect on your daily experiences with AI
                  assistance.
                </p>
              </div>
            </Link>
            <div className="feature-card" onClick={toggleGoalSetting} style={{cursor: 'pointer'}}>
              <h4>🎯 Goal Setting</h4>
              <p>Set and manage your personal goals.</p>
            </div>
            <div className="feature-card">
              <h4>Profile Management</h4>
              <p>Edit and manage your user information.</p>
            </div>
            <div className="feature-card">
              <h4>Settings</h4>
              <p>Change your account settings.</p>
            </div>
            <div className="feature-card">
              <h4>Help & Support</h4>
              <p>Check usage guides and contact support.</p>
            </div>
          </div>
        </div>
        {showGoalSetting && <GoalSetting />}
      </main>
    </div>
  );
};

export default Dashboard;
