import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import "./Auth.css";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    secretCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCounselorMode, setIsCounselorMode] = useState(false);
  const navigate = useNavigate();
  const { register, registerCounselor } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email format.");
      setLoading(false);
      return;
    }

    // Secret code validation for counselor mode
    if (isCounselorMode && !formData.secretCode.trim()) {
      setError("Secret code is required for counselor registration.");
      setLoading(false);
      return;
    }

    try {
      let result;

      if (isCounselorMode) {
        result = await registerCounselor({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          secretCode: formData.secretCode,
        });
      } else {
        result = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      }

      if (result.success) {
        alert(
          isCounselorMode
            ? "Counselor account created successfully!"
            : "Sign up completed successfully!"
        );
        navigate("/");
      } else {
        setError(result.error || "Sign up failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred during sign up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        Reflecta
      </motion.div>
      <motion.div
        className="auth-form"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h2>Sign Up</h2>

        <form onSubmit={handleSubmit}>
          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your name"
            />
          </motion.div>

          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
          >
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </motion.div>

          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              minLength="6"
            />
          </motion.div>

          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.9 }}
          >
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
              minLength="6"
            />
          </motion.div>

          {isCounselorMode && (
            <motion.div
              className="form-group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 1.0 }}
            >
              <label htmlFor="secretCode">Secret Code</label>
              <input
                type="password"
                id="secretCode"
                name="secretCode"
                value={formData.secretCode}
                onChange={handleChange}
                required={isCounselorMode}
                placeholder="Enter counselor secret code"
              />
              <small style={{ color: "#888", fontSize: "0.85em", marginTop: "5px", display: "block" }}>
                Contact your administrator to obtain the secret code
              </small>
            </motion.div>
          )}

          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            className="auth-button"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.0 }}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </motion.button>
        </form>

        <motion.div
          className="auth-link"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.1 }}
        >
          Already have an account? <Link to="/login">Login</Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.2 }}
          style={{
            marginTop: "15px",
            paddingTop: "15px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            textAlign: "center"
          }}
        >
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              cursor: "pointer",
              fontSize: "0.9em",
              color: "#b8b8b8"
            }}
          >
            <input
              type="checkbox"
              checked={isCounselorMode}
              onChange={(e) => {
                setIsCounselorMode(e.target.checked);
                if (!e.target.checked) {
                  setFormData({ ...formData, secretCode: "" });
                }
              }}
              style={{
                marginRight: "8px",
                cursor: "pointer"
              }}
            />
            <span style={{ whiteSpace: "nowrap" }}>I am a counselor</span>
          </label>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Signup;
