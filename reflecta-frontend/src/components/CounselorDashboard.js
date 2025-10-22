import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ApiService from "../services/api";
import { toast } from "react-toastify";
import "./CounselorDashboard.css";

const CounselorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filter, setFilter] = useState({ status: "", riskLevel: "" });
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteAction, setNoteAction] = useState("");

  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const filterParams = {};
      if (filter.status) filterParams.status = filter.status;
      if (filter.riskLevel) filterParams.riskLevel = filter.riskLevel;

      const response = await ApiService.getCounselorAlerts(filterParams);
      setAlerts(response.alerts || []);
      setStats(response.stats || {});
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const viewAlertDetails = async (alertId) => {
    try {
      const response = await ApiService.getAlertDetails(alertId);
      setSelectedAlert(response.alert);
      setShowAlertModal(true);
    } catch (error) {
      console.error("Failed to fetch alert details:", error);
      toast.error("Failed to load alert details");
    }
  };

  const updateAlertStatus = async (alertId, newStatus) => {
    try {
      await ApiService.updateAlertStatus(alertId, newStatus);
      toast.success(`Alert status updated to ${newStatus}`);
      fetchAlerts();
      if (selectedAlert && selectedAlert._id === alertId) {
        setSelectedAlert({ ...selectedAlert, status: newStatus });
      }
    } catch (error) {
      console.error("Failed to update alert status:", error);
      toast.error("Failed to update status");
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) {
      toast.warn("Please enter a note");
      return;
    }

    try {
      await ApiService.addCounselorNote(
        selectedAlert._id,
        noteText,
        noteAction || null
      );
      toast.success("Note added successfully");
      setNoteText("");
      setNoteAction("");

      // Refresh alert details
      const response = await ApiService.getAlertDetails(selectedAlert._id);
      setSelectedAlert(response.alert);
    } catch (error) {
      console.error("Failed to add note:", error);
      toast.error("Failed to add note");
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case "critical":
        return "#dc2626";
      case "high":
        return "#ea580c";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const getRiskLevelIcon = (level) => {
    switch (level) {
      case "critical":
        return "🚨";
      case "high":
        return "⚠️";
      case "medium":
        return "⚡";
      case "low":
        return "ℹ️";
      default:
        return "📋";
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      new: { bg: "#dbeafe", color: "#1e40af" },
      viewed: { bg: "#e0e7ff", color: "#4338ca" },
      in_progress: { bg: "#fef3c7", color: "#92400e" },
      resolved: { bg: "#d1fae5", color: "#065f46" },
      escalated: { bg: "#fee2e2", color: "#991b1b" },
    };

    const style = statusStyles[status] || statusStyles.new;

    return (
      <span
        className="status-badge"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="counselor-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Counselor Dashboard</h1>
          <p className="subtitle">Mental Health Risk Alert Monitoring</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Alerts</h3>
            <div className="stat-number">{stats.total}</div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card new"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="stat-icon">🔔</div>
          <div className="stat-content">
            <h3>New Alerts</h3>
            <div className="stat-number">{stats.new}</div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card critical"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <h3>Critical</h3>
            <div className="stat-number">{stats.critical}</div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card high"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>High Risk</h3>
            <div className="stat-number">{stats.high}</div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="filter-select"
          >
            <option value="">All</option>
            <option value="new">New</option>
            <option value="viewed">Viewed</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="escalated">Escalated</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Risk Level:</label>
          <select
            value={filter.riskLevel}
            onChange={(e) =>
              setFilter({ ...filter, riskLevel: e.target.value })
            }
            className="filter-select"
          >
            <option value="">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <button onClick={fetchAlerts} className="refresh-btn">
          �� Refresh
        </button>
      </div>

      {/* Alerts List */}
      <div className="alerts-section">
        <h2>Active Alerts</h2>

        {loading ? (
          <div className="loading-spinner">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="no-alerts">
            <div className="no-alerts-icon">✅</div>
            <h3>No alerts found</h3>
            <p>
              {filter.status || filter.riskLevel
                ? "Try adjusting your filters"
                : "All clear! No active alerts at this time."}
            </p>
          </div>
        ) : (
          <div className="alerts-list">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert._id}
                className="alert-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => viewAlertDetails(alert._id)}
              >
                <div className="alert-header-row">
                  <div className="alert-risk-indicator">
                    <span
                      className="risk-level-badge"
                      style={{
                        backgroundColor: getRiskLevelColor(alert.riskLevel),
                      }}
                    >
                      {getRiskLevelIcon(alert.riskLevel)} {alert.riskLevel}
                    </span>
                  </div>
                  {getStatusBadge(alert.status)}
                </div>

                <div className="alert-student-info">
                  <div className="student-avatar">
                    {alert.studentId?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3>{alert.studentId?.name || "Unknown Student"}</h3>
                    <p className="student-email">{alert.studentId?.email}</p>
                  </div>
                </div>

                <div className="alert-summary">
                  {alert.aiAnalysis?.summary || "No summary available"}
                </div>

                <div className="alert-meta">
                  <span>
                    📅 {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                  <span>
                    🕒 {new Date(alert.createdAt).toLocaleTimeString()}
                  </span>
                  <span>📝 {alert.triggerSource}</span>
                </div>

                <div className="alert-actions">
                  <button
                    className="btn-sm btn-view"
                    onClick={(e) => {
                      e.stopPropagation();
                      viewAlertDetails(alert._id);
                    }}
                  >
                    View Details
                  </button>
                  {alert.status === "new" && (
                    <button
                      className="btn-sm btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateAlertStatus(alert._id, "in_progress");
                      }}
                    >
                      Mark In Progress
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Alert Details Modal */}
      <AnimatePresence>
        {showAlertModal && selectedAlert && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAlertModal(false)}
          >
            <motion.div
              className="modal-content alert-details-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Alert Details</h2>
                <button
                  className="close-btn"
                  onClick={() => setShowAlertModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                {/* Student Info */}
                <div className="detail-section">
                  <h3>Student Information</h3>
                  <div className="student-detail-card">
                    <div className="student-avatar-large">
                      {selectedAlert.studentId?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4>{selectedAlert.studentId?.name}</h4>
                      <p>{selectedAlert.studentId?.email}</p>
                      {selectedAlert.studentId?.studentProfile && (
                        <div className="student-meta">
                          <span>
                            {selectedAlert.studentId.studentProfile.grade}
                          </span>
                          <span>
                            {selectedAlert.studentId.studentProfile.major}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="detail-section">
                  <h3>Risk Assessment</h3>
                  <div className="risk-assessment-card">
                    <div className="risk-level-display">
                      <span
                        className="risk-level-badge-large"
                        style={{
                          backgroundColor: getRiskLevelColor(
                            selectedAlert.riskLevel
                          ),
                        }}
                      >
                        {getRiskLevelIcon(selectedAlert.riskLevel)}{" "}
                        {selectedAlert.riskLevel} RISK
                      </span>
                      {getStatusBadge(selectedAlert.status)}
                    </div>

                    <div className="risk-factors">
                      <h4>Risk Factors</h4>
                      {selectedAlert.riskFactors?.map((factor, idx) => (
                        <div key={idx} className="risk-factor-item">
                          <span className="factor-type">{factor.type}</span>
                          <span className="factor-severity">
                            {factor.severity}
                          </span>
                          <p>{factor.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="detail-section">
                  <h3>AI Analysis</h3>
                  <div className="ai-analysis-card">
                    <p className="analysis-summary">
                      {selectedAlert.aiAnalysis?.summary}
                    </p>

                    {selectedAlert.aiAnalysis?.keyPhrases?.length > 0 && (
                      <div className="key-phrases">
                        <h4>Key Phrases Detected:</h4>
                        <div className="phrases-list">
                          {selectedAlert.aiAnalysis.keyPhrases.map(
                            (phrase, idx) => (
                              <span key={idx} className="phrase-badge">
                                {phrase}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {selectedAlert.aiAnalysis?.recommendations?.length > 0 && (
                      <div className="recommendations">
                        <h4>Recommendations:</h4>
                        <ul>
                          {selectedAlert.aiAnalysis.recommendations.map(
                            (rec, idx) => (
                              <li key={idx}>{rec}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="analysis-meta">
                      <span>
                        Confidence:{" "}
                        {(
                          (selectedAlert.aiAnalysis?.confidence || 0) * 100
                        ).toFixed(0)}
                        %
                      </span>
                      <span>
                        Mood Trend: {selectedAlert.aiAnalysis?.moodTrend}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Actions */}
                <div className="detail-section">
                  <h3>Update Status</h3>
                  <div className="status-actions">
                    <button
                      className="status-btn viewed"
                      onClick={() =>
                        updateAlertStatus(selectedAlert._id, "viewed")
                      }
                    >
                      Mark as Viewed
                    </button>
                    <button
                      className="status-btn in-progress"
                      onClick={() =>
                        updateAlertStatus(selectedAlert._id, "in_progress")
                      }
                    >
                      In Progress
                    </button>
                    <button
                      className="status-btn escalated"
                      onClick={() =>
                        updateAlertStatus(selectedAlert._id, "escalated")
                      }
                    >
                      Escalate
                    </button>
                    <button
                      className="status-btn resolved"
                      onClick={() =>
                        updateAlertStatus(selectedAlert._id, "resolved")
                      }
                    >
                      Resolve
                    </button>
                  </div>
                </div>

                {/* Counselor Notes */}
                <div className="detail-section">
                  <h3>Counselor Notes</h3>

                  <div className="add-note-form">
                    <textarea
                      className="note-textarea"
                      placeholder="Add a note about your interaction with the student..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={4}
                    />

                    <div className="note-action-row">
                      <select
                        className="note-action-select"
                        value={noteAction}
                        onChange={(e) => setNoteAction(e.target.value)}
                      >
                        <option value="">Select action taken...</option>
                        <option value="contacted">Contacted Student</option>
                        <option value="scheduled">Scheduled Session</option>
                        <option value="referred">Referred to Specialist</option>
                        <option value="monitoring">Monitoring</option>
                        <option value="resolved">Issue Resolved</option>
                      </select>

                      <button className="btn-add-note" onClick={addNote}>
                        Add Note
                      </button>
                    </div>
                  </div>

                  {selectedAlert.counselorNotes?.length > 0 && (
                    <div className="notes-history">
                      <h4>Previous Notes:</h4>
                      {selectedAlert.counselorNotes
                        .slice()
                        .reverse()
                        .map((note, idx) => (
                          <div key={idx} className="note-item">
                            <div className="note-header">
                              <strong>
                                {note.counselorId?.name || "Counselor"}
                              </strong>
                              {note.action && (
                                <span className="note-action-badge">
                                  {note.action}
                                </span>
                              )}
                              <span className="note-date">
                                {new Date(note.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="note-text">{note.note}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CounselorDashboard;
