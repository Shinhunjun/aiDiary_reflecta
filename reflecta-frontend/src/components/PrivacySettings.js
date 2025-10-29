import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ApiService from "../services/api";
import { toast } from "react-toastify";
import "./PrivacySettings.css";

const PrivacySettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    riskMonitoring: {
      enabled: false,
      shareLevel: "summary",
    },
  });
  const [userRole, setUserRole] = useState("student");

  useEffect(() => {
    fetchPrivacySettings();
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      const response = await ApiService.getPrivacySettings();
      setPrivacySettings(response.privacySettings || {
        riskMonitoring: {
          enabled: false,
          shareLevel: "summary",
        },
      });
      setUserRole(response.role);
    } catch (error) {
      console.error("Failed to fetch privacy settings:", error);
      toast.error("Failed to load privacy settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRiskMonitoring = async (enabled) => {
    setSaving(true);
    try {
      const updatedSettings = {
        ...privacySettings,
        riskMonitoring: {
          ...privacySettings.riskMonitoring,
          enabled,
        },
      };

      await ApiService.updatePrivacySettings({
        riskMonitoring: updatedSettings.riskMonitoring,
      });

      setPrivacySettings(updatedSettings);
      toast.success(
        enabled
          ? "Risk monitoring enabled successfully"
          : "Risk monitoring disabled successfully"
      );
    } catch (error) {
      console.error("Failed to update risk monitoring:", error);
      toast.error("Failed to update risk monitoring");
    } finally {
      setSaving(false);
    }
  };

  const handleShareLevelChange = async (shareLevel) => {
    setSaving(true);
    try {
      const updatedSettings = {
        ...privacySettings,
        riskMonitoring: {
          ...privacySettings.riskMonitoring,
          shareLevel,
        },
      };

      await ApiService.updatePrivacySettings({
        riskMonitoring: updatedSettings.riskMonitoring,
      });

      setPrivacySettings(updatedSettings);
      toast.success("Privacy level updated successfully");
    } catch (error) {
      console.error("Failed to update privacy level:", error);
      toast.error("Failed to update privacy level");
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="privacy-settings-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (userRole !== "student") {
    return (
      <div className="privacy-settings-container">
        <div className="alert alert-info">
          Privacy settings are only available for student accounts.
        </div>
      </div>
    );
  }

  const riskMonitoringEnabled = privacySettings.riskMonitoring?.enabled || false;
  const shareLevel = privacySettings.riskMonitoring?.shareLevel || "summary";

  return (
    <motion.div
      className="privacy-settings-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="privacy-settings-header">
        <h1>Privacy Settings</h1>
        <p className="subtitle">
          Control how your mental health information is shared with counselors
        </p>
      </div>

      {/* Risk Monitoring Toggle */}
      <motion.div
        className="settings-card"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="card-header">
          <h2>Mental Health Risk Monitoring</h2>
          <div className="toggle-switch">
            <input
              type="checkbox"
              id="risk-monitoring-toggle"
              checked={riskMonitoringEnabled}
              onChange={(e) => handleToggleRiskMonitoring(e.target.checked)}
              disabled={saving}
            />
            <label htmlFor="risk-monitoring-toggle" className="toggle-label">
              <span className="toggle-inner" />
              <span className="toggle-button" />
            </label>
          </div>
        </div>

        <div className="card-body">
          <p className="description">
            When enabled, our AI system will analyze your journal entries and
            mood patterns to detect signs of mental health concerns. If a
            potential risk is detected, all counselors will be
            notified and can offer support.
          </p>

          <div className="privacy-notice">
            <div className="notice-icon">🔒</div>
            <div className="notice-content">
              <strong>Your Privacy Matters</strong>
              <p>
                You have full control over what information is shared. You can
                choose your privacy level below. All counselors will have
                access to risk alerts based on your privacy settings. You can change these settings or
                disable monitoring at any time.
              </p>
            </div>
          </div>

          {riskMonitoringEnabled && (
            <div className="consent-date">
              Monitoring enabled on:{" "}
              {privacySettings.riskMonitoring?.consentDate
                ? new Date(
                    privacySettings.riskMonitoring.consentDate
                  ).toLocaleDateString()
                : "Today"}
            </div>
          )}
        </div>
      </motion.div>

      {/* Privacy Level Selection */}
      {riskMonitoringEnabled && (
        <motion.div
          className="settings-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card-header">
            <h2>Information Sharing Level</h2>
          </div>

          <div className="card-body">
            <div className="privacy-levels">
              <div
                className={`privacy-level-option ${
                  shareLevel === "summary" ? "selected" : ""
                }`}
                onClick={() => handleShareLevelChange("summary")}
                role="button"
                tabIndex={0}
              >
                <div className="level-icon">📊</div>
                <div className="level-content">
                  <h3>Summary Only</h3>
                  <p>
                    Counselors see only AI-generated summaries of detected
                    risks. No access to your actual journal entries or detailed
                    mood data.
                  </p>
                  <ul className="level-features">
                    <li>✓ Risk level (low, medium, high, critical)</li>
                    <li>✓ Brief AI summary</li>
                    <li>✗ Journal content</li>
                    <li>✗ Detailed mood patterns</li>
                  </ul>
                </div>
              </div>

              <div
                className={`privacy-level-option ${
                  shareLevel === "moderate" ? "selected" : ""
                }`}
                onClick={() => handleShareLevelChange("moderate")}
                role="button"
                tabIndex={0}
              >
                <div className="level-icon">📈</div>
                <div className="level-content">
                  <h3>Moderate Sharing</h3>
                  <p>
                    Counselors see risk summaries plus aggregated mood trends
                    and patterns. Journal content remains private.
                  </p>
                  <ul className="level-features">
                    <li>✓ Everything in Summary</li>
                    <li>✓ Mood trend graphs</li>
                    <li>✓ Pattern analysis</li>
                    <li>✗ Journal content</li>
                  </ul>
                </div>
              </div>

              <div
                className={`privacy-level-option ${
                  shareLevel === "detailed" ? "selected" : ""
                }`}
                onClick={() => handleShareLevelChange("detailed")}
                role="button"
                tabIndex={0}
              >
                <div className="level-icon">📝</div>
                <div className="level-content">
                  <h3>Detailed Sharing</h3>
                  <p>
                    Counselors have full access to risk alerts, mood data, and
                    the specific journal entries that triggered alerts (not all
                    entries).
                  </p>
                  <ul className="level-features">
                    <li>✓ Everything in Moderate</li>
                    <li>✓ Triggering journal entries</li>
                    <li>✓ Detailed AI analysis</li>
                    <li>✓ Key phrases identified</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}


      {/* Information Section */}
      <motion.div
        className="settings-card info-card"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="card-header">
          <h2>How Risk Monitoring Works</h2>
        </div>

        <div className="card-body">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-icon">🤖</div>
              <h3>AI Analysis</h3>
              <p>
                Our AI system analyzes your journal entries for indicators of
                mental health concerns, including mood changes, stress patterns,
                and concerning language.
              </p>
            </div>

            <div className="info-item">
              <div className="info-icon">🔔</div>
              <h3>Alert System</h3>
              <p>
                When a potential risk is detected, alerts are sent to your
                selected counselors based on the severity level (low, medium,
                high, or critical).
              </p>
            </div>

            <div className="info-item">
              <div className="info-icon">🤝</div>
              <h3>Counselor Support</h3>
              <p>
                All counselors can view alerts, track patterns over time, and
                reach out to offer support when needed. They respect your
                privacy settings at all times.
              </p>
            </div>

            <div className="info-item">
              <div className="info-icon">🔐</div>
              <h3>Data Security</h3>
              <p>
                All data is encrypted and stored securely. Counselors can access your risk alert information
                within the limits you set in your privacy settings.
              </p>
            </div>
          </div>

          <div className="ferpa-notice">
            <strong>FERPA Compliance</strong>
            <p>
              This system complies with the Family Educational Rights and
              Privacy Act (FERPA). Your educational records, including mental
              health information, are protected. Counselors are bound by
              confidentiality agreements and ethical guidelines.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PrivacySettings;
