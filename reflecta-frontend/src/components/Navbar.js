import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-logo">
          <h1>Reflecta</h1>
        </Link>
        <nav className="nav-links">
          {isAuthenticated ? (
            <div className="user-nav">
              <span className="user-greeting">
                Hello, {user?.name || 'User'}!
              </span>
              <Link to="/journal" className="nav-button">
                Journal
              </Link>
              <Link to="/goal-setting" className="nav-button">
                Goals
              </Link>
              <button onClick={handleLogout} className="nav-button primary">
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-nav">
              <Link to="/login" className="nav-button">
                Login
              </Link>
              <Link to="/signup" className="nav-button primary">
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
