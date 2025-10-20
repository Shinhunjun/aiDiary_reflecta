import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Sidebar.css";

const Sidebar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">Reflecta</h1>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon">ℹ️</span>
          <span className="sidebar-label">About</span>
        </NavLink>

        <NavLink
          to="/goal-setting"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon">🎯</span>
          <span className="sidebar-label">Goal</span>
        </NavLink>

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon">📊</span>
          <span className="sidebar-label">Dashboard</span>
        </NavLink>

        <NavLink
          to="/journal"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon">📝</span>
          <span className="sidebar-label">Journal</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info-sidebar">
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.name || "User"}</div>
            <div className="user-email">{user?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
