import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import apiService from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import ProgressAnalytics from "./ProgressAnalytics";
import ProgressCalendar from "./ProgressCalendar";
import CompletionRings from "./CompletionRings";
import MilestoneTimeline from "./MilestoneTimeline";
import "./ProgressTracking.css";

const PERIOD_OPTIONS = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "yearly", label: "Yearly" },
];

const ProgressTracking = () => {
  const { user } = useAuth();
  const [goalPackages, setGoalPackages] = useState([]);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [focusedSubGoalId, setFocusedSubGoalId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState("weekly");
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState("");
  const [journalSummary, setJournalSummary] = useState(null);
  const [loadingJournalSummary, setLoadingJournalSummary] = useState(false);
  const [childrenSummary, setChildrenSummary] = useState(null);
  const [loadingChildrenSummary, setLoadingChildrenSummary] = useState(false);

  useEffect(() => {
    const loadGoals = async () => {
      try {
        setLoadingGoals(true);
        const data = await apiService.getGoals();
        const packages = Array.isArray(data) ? data : data ? [data] : [];
        setGoalPackages(packages);

        if (packages.length > 0 && packages[0].mandalartData?.id) {
          setSelectedGoalId(packages[0].mandalartData.id);
        }
      } catch (err) {
        console.error("Failed to load goals:", err);
        setError("Failed to load goals. Please try again later.");
      } finally {
        setLoadingGoals(false);
      }
    };

    if (user?.id) {
      loadGoals();
    }
  }, [user?.id]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!selectedGoalId) return;

      try {
        setLoadingSummary(true);
        setError("");
        const data = await apiService.getGoalProgressSummary(
          selectedGoalId,
          period
        );
        setSummary(data);
      } catch (err) {
        console.error("Failed to load progress summary:", err);
        setError("Unable to load progress summary. Please try again.");
        setSummary(null);
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchSummary();
  }, [selectedGoalId, period]);

  useEffect(() => {
    const fetchJournalSummary = async () => {
      if (!selectedGoalId) return;

      try {
        setLoadingJournalSummary(true);
        const data = await apiService.getGoalJournalSummary(selectedGoalId);
        setJournalSummary(data);
      } catch (err) {
        console.error("Failed to load journal summary:", err);
        setJournalSummary(null);
      } finally {
        setLoadingJournalSummary(false);
      }
    };

    fetchJournalSummary();
  }, [selectedGoalId]);

  useEffect(() => {
    const fetchChildrenSummary = async () => {
      if (!selectedGoalId) return;

      try {
        setLoadingChildrenSummary(true);
        const data = await apiService.getGoalChildrenSummary(selectedGoalId);
        setChildrenSummary(data);
      } catch (err) {
        console.error("Failed to load children summary:", err);
        setChildrenSummary(null);
      } finally {
        setLoadingChildrenSummary(false);
      }
    };

    fetchChildrenSummary();
  }, [selectedGoalId]);

  const goalLookup = useMemo(() => {
    const map = new Map();

    const traverse = (node, parentId = null) => {
      if (!node || !node.id) return;
      map.set(node.id, { text: node.text || "Unnamed goal", parentId });
      if (Array.isArray(node.subGoals)) {
        node.subGoals.filter(Boolean).forEach((child) =>
          traverse(child, node.id)
        );
      }
    };

    goalPackages.forEach((pkg) => {
      if (pkg?.mandalartData) {
        traverse(pkg.mandalartData);
      }
    });

    return map;
  }, [goalPackages]);

  const activeGoalTitle = useMemo(() => {
    if (!selectedGoalId) return "Select a goal";
    return goalLookup.get(selectedGoalId)?.text || "Selected Goal";
  }, [goalLookup, selectedGoalId]);

  const focusedSubSummary = useMemo(() => {
    if (!summary || !focusedSubGoalId) return null;
    return summary.subGoals?.find((item) => item.id === focusedSubGoalId);
  }, [summary, focusedSubGoalId]);

  const renderGoalNode = (node, rootGoalId, depth = 0) => {
    if (!node || !node.id || !node.text) return null;
    const isRoot = depth === 0;
    const isSelectedRoot = selectedGoalId === node.id;
    const isFocused = focusedSubGoalId === node.id;

    const handleClick = () => {
      if (isRoot) {
        setSelectedGoalId(node.id);
        setFocusedSubGoalId(null);
      } else {
        setSelectedGoalId(rootGoalId);
        setFocusedSubGoalId(node.id);
      }

      // Scroll to summary section after a short delay
      setTimeout(() => {
        const summarySection = document.querySelector('.children-summary-section, .journal-summary-section');
        if (summarySection) {
          summarySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    };

    return (
      <div
        key={node.id}
        className={`goal-tree-item depth-${depth} ${
          isRoot && isSelectedRoot ? "active" : ""
        } ${!isRoot && isFocused ? "focused" : ""}`}
        onClick={handleClick}
      >
        <div className="goal-tree-label">
          <span className="goal-dot" aria-hidden />
          <span>{node.text}</span>
        </div>
        {Array.isArray(node.subGoals) && node.subGoals.filter(Boolean).length > 0 && (
          <div className="goal-tree-children">
            {node.subGoals
              .filter(Boolean)
              .map((child) => renderGoalNode(child, rootGoalId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderGoalSidebar = () => {
    if (loadingGoals) {
      return <div className="sidebar-placeholder">Loading goals...</div>;
    }

    if (!goalPackages.length) {
      return (
        <div className="sidebar-placeholder">
          No goals found yet. Head over to the goal setting page to get started!
        </div>
      );
    }

    return goalPackages.map((pkg) => {
      const node = pkg.mandalartData;
      if (!node?.id) return null;
      return (
        <div key={node.id} className="goal-tree-root">
          {renderGoalNode(node, node.id)}
        </div>
      );
    });
  };

  const renderSummaryContent = () => {
    if (loadingSummary) {
      return <div className="summary-placeholder">Loading summary...</div>;
    }

    if (!summary) {
      return (
        <div className="summary-placeholder">
          Select a goal to see progress insights.
        </div>
      );
    }

    const { totals, progressTypes = [], subGoals = [], timeline = [] } = summary;
    const totalEntries = totals?.totalEntries || 0;
    const totalTime = totals?.totalTime || 0;
    const lastActivity = totals?.lastActivity
      ? new Date(totals.lastActivity).toLocaleString()
      : "No activity yet";

    return (
      <>
        <section className="summary-cards">
          <div className="summary-card">
            <span className="summary-label">Entries</span>
            <span className="summary-value">{totalEntries}</span>
            <span className="summary-hint">Logs during this {period}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Focused Time</span>
            <span className="summary-value">{Math.round(totalTime)} min</span>
            <span className="summary-hint">Total recorded time</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Last Update</span>
            <span className="summary-value small">{lastActivity}</span>
            <span className="summary-hint">Most recent log</span>
          </div>
        </section>

        {focusedSubSummary && (
          <section className="focus-card">
            <h4>Focused Sub-goal</h4>
            <p className="focus-name">
              {goalLookup.get(focusedSubSummary.id)?.text || "Sub-goal"}
            </p>
            <div className="focus-metrics">
              <div>
                <span className="metric-label">Entries</span>
                <span className="metric-value">{focusedSubSummary.count}</span>
              </div>
              <div>
                <span className="metric-label">Time</span>
                <span className="metric-value">
                  {Math.round(focusedSubSummary.totalTime)} min
                </span>
              </div>
              <div>
                <span className="metric-label">Last entry</span>
                <span className="metric-value">
                  {focusedSubSummary.lastEntry
                    ? new Date(focusedSubSummary.lastEntry).toLocaleString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </section>
        )}

        <section className="summary-section">
          <header>
            <h4>Sub-goal Contributions</h4>
          </header>
          {subGoals.length === 0 ? (
            <div className="summary-placeholder small">
              No progress entries found for this period.
            </div>
          ) : (
            <ul className="subgoal-list">
              {subGoals.map((item) => (
                <li key={item.id} className="subgoal-item">
                  <div>
                    <p className="subgoal-name">
                      {goalLookup.get(item.id)?.text || item.label}
                    </p>
                    <span className="subgoal-hint">
                      Last update: {item.lastEntry ? new Date(item.lastEntry).toLocaleString() : "N/A"}
                    </span>
                  </div>
                  <div className="subgoal-stats">
                    <span>{item.count} entries</span>
                    <span>{Math.round(item.totalTime)} min</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="summary-section">
          <header>
            <h4>Progress Types</h4>
          </header>
          {progressTypes.length === 0 ? (
            <div className="summary-placeholder small">No activity recorded.</div>
          ) : (
            <div className="type-grid">
              {progressTypes.map((item) => (
                <div key={item.type} className="type-card">
                  <span className="type-label">{item.type}</span>
                  <span className="type-count">{item.count}</span>
                  <span className="type-hint">
                    Last entry: {item.lastEntry ? new Date(item.lastEntry).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="summary-section">
          <header>
            <h4>Timeline</h4>
          </header>
          {timeline.length === 0 ? (
            <div className="summary-placeholder small">No timeline data.</div>
          ) : (
            <ul className="timeline-list">
              {timeline.map((item) => (
                <li key={item.bucket}>
                  <div className="timeline-date">{item.bucket}</div>
                  <div className="timeline-bar">
                    <div className="timeline-total">{item.total} entries</div>
                    <div className="timeline-breakdown">
                      {item.breakdown.map((detail) => (
                        <span key={detail.type}>
                          {detail.type}: {detail.count}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Sub-Goals Progress Overview */}
        {childrenSummary && childrenSummary.childGoalsCount > 0 && (
          <section className="summary-section children-summary-section">
            <header>
              <h4>🎯 Sub-Goals Overview</h4>
              <span className="summary-subtitle">Progress across {childrenSummary.childGoalsCount} sub-goals</span>
            </header>
            {loadingChildrenSummary ? (
              <div className="summary-placeholder">Analyzing sub-goals progress...</div>
            ) : childrenSummary.totalEntries > 0 ? (
              <div className="children-summary-content">
                <div className="children-summary-header">
                  <div className="children-summary-stats">
                    <div className="stat-item">
                      <span className="stat-label">Sub-Goals</span>
                      <span className="stat-value">{childrenSummary.childGoalsCount}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total Entries</span>
                      <span className="stat-value">{childrenSummary.totalEntries}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Active Goals</span>
                      <span className="stat-value">{childrenSummary.childGoalsSummaries?.length || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="children-summary-text">
                  <h5>Overall Progress for: {childrenSummary.goalText}</h5>
                  <p>{childrenSummary.summary}</p>
                </div>

                {childrenSummary.childGoalsSummaries && childrenSummary.childGoalsSummaries.length > 0 && (
                  <div className="child-goals-grid">
                    <h5>Individual Sub-Goal Progress</h5>
                    <div className="child-goals-list">
                      {childrenSummary.childGoalsSummaries.map((childGoal) => (
                        <div key={childGoal.goalId} className="child-goal-card">
                          <div className="child-goal-header">
                            <h6>{childGoal.goalText}</h6>
                            <span className="child-goal-count">{childGoal.entryCount} entries</span>
                          </div>
                          <div className="child-goal-meta">
                            <span className="child-goal-dates">
                              {new Date(childGoal.dateRange.start).toLocaleDateString()} - {new Date(childGoal.dateRange.end).toLocaleDateString()}
                            </span>
                            <span className={`child-goal-mood mood-${childGoal.latestMood}`}>
                              Latest: {childGoal.latestMood}
                            </span>
                          </div>
                          {childGoal.moodDistribution && (
                            <div className="child-goal-mood-mini">
                              {Object.entries(childGoal.moodDistribution)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 3)
                                .map(([mood, count]) => (
                                  <span key={mood} className="mood-badge">
                                    {mood} ({count})
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="summary-placeholder small">
                No journal entries found for sub-goals yet.
              </div>
            )}
          </section>
        )}

        {/* AI-Powered Journal Summary */}
        <section className="summary-section journal-summary-section">
          <header>
            <h4>📝 Journal Insights</h4>
            <span className="summary-subtitle">AI-powered summary of your journal entries</span>
          </header>
          {loadingJournalSummary ? (
            <div className="summary-placeholder">Analyzing your journal entries...</div>
          ) : journalSummary && journalSummary.entryCount > 0 ? (
            <div className="journal-summary-content">
              <div className="journal-summary-header">
                <div className="journal-summary-stats">
                  <div className="stat-item">
                    <span className="stat-label">Entries</span>
                    <span className="stat-value">{journalSummary.entryCount}</span>
                  </div>
                  {journalSummary.dateRange && (
                    <div className="stat-item">
                      <span className="stat-label">Period</span>
                      <span className="stat-value small">
                        {new Date(journalSummary.dateRange.start).toLocaleDateString()} - {new Date(journalSummary.dateRange.end).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="journal-summary-text">
                <h5>Summary for: {journalSummary.goalText}</h5>
                <p>{journalSummary.summary}</p>
              </div>

              {journalSummary.moodDistribution && Object.keys(journalSummary.moodDistribution).length > 0 && (
                <div className="mood-distribution">
                  <h5>Mood Distribution</h5>
                  <div className="mood-bars">
                    {Object.entries(journalSummary.moodDistribution)
                      .sort((a, b) => b[1] - a[1])
                      .map(([mood, count]) => (
                        <div key={mood} className="mood-bar-item">
                          <span className="mood-label">{mood}</span>
                          <div className="mood-bar-container">
                            <div
                              className="mood-bar-fill"
                              style={{ width: `${(count / journalSummary.entryCount) * 100}%` }}
                            />
                          </div>
                          <span className="mood-count">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {journalSummary.keyThemes && journalSummary.keyThemes.length > 0 && (
                <div className="key-themes">
                  <h5>Key Themes</h5>
                  <div className="theme-tags">
                    {journalSummary.keyThemes.map((theme, idx) => (
                      <span key={idx} className="theme-tag">{theme}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="summary-placeholder small">
              No journal entries found for this goal. Start journaling to see AI-powered insights!
            </div>
          )}
        </section>

        {/* Enhanced Analytics Components */}
        <section className="analytics-section">
          <CompletionRings
            goalId={selectedGoalId}
            mandalartData={goalPackages.find(pkg => pkg.mandalartData?.id === selectedGoalId)?.mandalartData}
            apiService={apiService}
          />
        </section>

        <section className="analytics-section">
          <ProgressCalendar
            goalId={selectedGoalId}
            apiService={apiService}
          />
        </section>

        <section className="analytics-section">
          <ProgressAnalytics
            goalId={selectedGoalId}
            apiService={apiService}
          />
        </section>

        <section className="analytics-section">
          <MilestoneTimeline
            goalId={selectedGoalId}
            apiService={apiService}
          />
        </section>
      </>
    );
  };

  return (
    <div className="progress-tracking-wrapper">
      <div className="progress-tracking-header">
        <div>
          <h2>{activeGoalTitle}</h2>
          <p>Stay on top of your goals with weekly, monthly, and yearly insights.</p>
        </div>
        <div className="progress-period-switcher">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.key}
              className={option.key === period ? "active" : ""}
              onClick={() => setPeriod(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="progress-tracking-layout">
        <aside className="progress-sidebar">
          <div className="sidebar-header">
            <h3>Your Goals</h3>
            <Link to="/goal-setting">Manage Goals →</Link>
          </div>
          <div className="sidebar-content">{renderGoalSidebar()}</div>
        </aside>

        <main className="progress-content">
          {error && <div className="error-banner">{error}</div>}
          {renderSummaryContent()}
        </main>
      </div>
    </div>
  );
};

export default ProgressTracking;
