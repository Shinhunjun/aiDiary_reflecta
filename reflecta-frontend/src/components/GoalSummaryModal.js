import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./GoalSummaryModal.css";

const GoalSummaryModal = ({
  isOpen,
  onClose,
  goalText,
  journalSummary,
  childrenSummary,
  loadingJournalSummary,
  loadingChildrenSummary,
}) => {
  if (!isOpen) return null;

  const getMoodColor = (mood) => {
    const moodColors = {
      happy: "#4ade80",
      excited: "#fbbf24",
      grateful: "#a78bfa",
      calm: "#60a5fa",
      reflective: "#8b5cf6",
      neutral: "#94a3b8",
      anxious: "#fb923c",
      sad: "#f87171",
      angry: "#dc2626",
      stressed: "#ea580c",
    };
    return moodColors[mood?.toLowerCase()] || "#94a3b8";
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>{goalText}</h2>
            <button className="modal-close-btn" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="modal-body">
            {/* Children Summary Section */}
            {childrenSummary && (
              <div className="children-summary-section">
                <h3 className="summary-title">Sub-Goals Progress Overview</h3>

                {loadingChildrenSummary ? (
                  <div className="loading-spinner">Loading summary...</div>
                ) : (
                  <>
                    {/* Overall Summary */}
                    {childrenSummary.summary && (
                      <div className="overall-summary">
                        <h4>Overall Progress Analysis</h4>
                        <p>{childrenSummary.summary}</p>
                        <div className="summary-stats">
                          <span>
                            📝 {childrenSummary.totalEntries} total journal
                            entries
                          </span>
                          <span>
                            🎯 {childrenSummary.childGoalsSummaries?.length}{" "}
                            active sub-goals
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Individual Child Goals */}
                    {childrenSummary.childGoalsSummaries &&
                      childrenSummary.childGoalsSummaries.length > 0 && (
                        <div className="child-goals-grid">
                          {childrenSummary.childGoalsSummaries.map(
                            (child, index) => (
                              <div
                                key={child.goalId || index}
                                className="child-goal-card"
                                style={{
                                  borderLeft: `4px solid ${getMoodColor(
                                    child.dominantMood
                                  )}`,
                                }}
                              >
                                <div className="child-goal-header">
                                  <h4>{child.goalText}</h4>
                                  <span className="entry-count">
                                    {child.entryCount} entries
                                  </span>
                                </div>

                                <p className="child-goal-summary">
                                  {child.summary}
                                </p>

                                {child.dominantMood && (
                                  <div className="mood-indicator">
                                    <span
                                      className="mood-dot"
                                      style={{
                                        backgroundColor: getMoodColor(
                                          child.dominantMood
                                        ),
                                      }}
                                    />
                                    <span className="mood-label">
                                      Dominant mood: {child.dominantMood}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      )}

                    {(!childrenSummary.childGoalsSummaries ||
                      childrenSummary.childGoalsSummaries.length === 0) && (
                      <div className="no-data-message">
                        No sub-goal data available yet. Start journaling to see
                        progress insights!
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Journal Summary Section */}
            {journalSummary && (
              <div className="journal-summary-section">
                <h3 className="summary-title">Journal Insights</h3>

                {loadingJournalSummary ? (
                  <div className="loading-spinner">Loading insights...</div>
                ) : (
                  <>
                    {journalSummary.summary && (
                      <div className="insights-summary">
                        <p>{journalSummary.summary}</p>
                        <div className="insights-stats">
                          <span>📝 {journalSummary.entryCount} entries</span>
                          {journalSummary.dateRange && (
                            <span>
                              📅 {journalSummary.dateRange.start} to{" "}
                              {journalSummary.dateRange.end}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mood Distribution */}
                    {journalSummary.moodDistribution &&
                      Object.keys(journalSummary.moodDistribution).length >
                        0 && (
                        <div className="mood-distribution">
                          <h4>Mood Distribution</h4>
                          <div className="mood-bars">
                            {Object.entries(journalSummary.moodDistribution)
                              .sort(([, a], [, b]) => b - a)
                              .map(([mood, count]) => (
                                <div key={mood} className="mood-bar-container">
                                  <span className="mood-name">{mood}</span>
                                  <div className="mood-bar-wrapper">
                                    <div
                                      className="mood-bar"
                                      style={{
                                        width: `${
                                          (count / journalSummary.entryCount) *
                                          100
                                        }%`,
                                        backgroundColor: getMoodColor(mood),
                                      }}
                                    />
                                    <span className="mood-count">{count}</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    {/* Key Themes */}
                    {journalSummary.keyThemes &&
                      journalSummary.keyThemes.length > 0 && (
                        <div className="key-themes">
                          <h4>Key Themes</h4>
                          <div className="themes-list">
                            {journalSummary.keyThemes.map((theme, index) => (
                              <span key={index} className="theme-tag">
                                {theme}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {!journalSummary.summary && (
                      <div className="no-data-message">
                        No journal entries found for this goal yet. Start
                        journaling to see insights!
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {!childrenSummary && !journalSummary && (
              <div className="no-data-message">
                No data available. Start journaling to see progress insights!
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GoalSummaryModal;
