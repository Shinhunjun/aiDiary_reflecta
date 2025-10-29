import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/api";
import GoalSummaryModal from "./GoalSummaryModal";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [goals, setGoals] = useState(null);
  const [journalStats, setJournalStats] = useState({ total: 0, thisWeek: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [selectedGoalText, setSelectedGoalText] = useState("");
  const [journalSummary, setJournalSummary] = useState(null);
  const [childrenSummary, setChildrenSummary] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [loadingJournalSummary, setLoadingJournalSummary] = useState(false);
  const [loadingChildrenSummary, setLoadingChildrenSummary] = useState(false);
  const [loadingJournalEntries, setLoadingJournalEntries] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);

        // Load goals
        const goalsResponse = await apiService.getGoals();
        if (Array.isArray(goalsResponse) && goalsResponse.length > 0) {
          setGoals(goalsResponse[0].mandalartData);
        } else if (goalsResponse && goalsResponse.mandalartData) {
          setGoals(goalsResponse.mandalartData);
        }

        // Load journal entries
        const journals = await apiService.getJournalEntries();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const thisWeekCount = journals.filter(
          (j) => new Date(j.date) > weekAgo
        ).length;
        setJournalStats({ total: journals.length, thisWeek: thisWeekCount });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  // Fetch journal summary when goal is selected
  useEffect(() => {
    const fetchJournalSummary = async () => {
      if (!selectedGoalId) {
        setJournalSummary(null);
        return;
      }

      try {
        setLoadingJournalSummary(true);
        const summary = await apiService.getGoalJournalSummary(selectedGoalId);
        setJournalSummary(summary);
      } catch (error) {
        console.error("Failed to fetch journal summary:", error);
        setJournalSummary(null);
      } finally {
        setLoadingJournalSummary(false);
      }
    };

    fetchJournalSummary();
  }, [selectedGoalId]);

  // Fetch children summary when goal is selected
  useEffect(() => {
    const fetchChildrenSummary = async () => {
      if (!selectedGoalId) {
        setChildrenSummary(null);
        return;
      }

      try {
        setLoadingChildrenSummary(true);
        const summary = await apiService.getGoalChildrenSummary(selectedGoalId);
        setChildrenSummary(summary);
      } catch (error) {
        console.error("Failed to fetch children summary:", error);
        setChildrenSummary(null);
      } finally {
        setLoadingChildrenSummary(false);
      }
    };

    fetchChildrenSummary();
  }, [selectedGoalId]);

  // Fetch journal entries when goal is selected
  useEffect(() => {
    const fetchJournalEntries = async () => {
      if (!selectedGoalId) {
        setJournalEntries([]);
        return;
      }

      try {
        setLoadingJournalEntries(true);
        const entries = await apiService.getGoalJournals(selectedGoalId);
        setJournalEntries(entries || []);
      } catch (error) {
        console.error("Failed to fetch journal entries:", error);
        setJournalEntries([]);
      } finally {
        setLoadingJournalEntries(false);
      }
    };

    fetchJournalEntries();
  }, [selectedGoalId]);

  const handleGoalClick = (goal) => {
    setSelectedGoalId(goal.id);
    setSelectedGoalText(goal.text);
    setShowSummaryModal(true);
  };

  const calculateGoalStats = () => {
    if (!goals || !goals.subGoals) {
      return { primary: 0, secondary: 0, completed: 0 };
    }

    const primaryGoals = goals.subGoals.filter((g) => g && g.text);
    const secondaryGoals = primaryGoals.reduce((count, goal) => {
      if (!goal.subGoals) return count;
      return count + goal.subGoals.filter((sg) => sg && sg.text).length;
    }, 0);

    return {
      primary: primaryGoals.length,
      secondary: secondaryGoals,
      completed: 0,
    };
  };

  const goalStats = calculateGoalStats();

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Goal Progress Dashboard</h1>
        <p>Track your journey towards achieving your goals</p>
      </header>

      <main className="dashboard-main">
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3>{goalStats.primary}</h3>
              <p>Primary Goals</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>{goalStats.secondary}</h3>
              <p>Sub-Goals</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <h3>{journalStats.total}</h3>
              <p>Total Journals</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{journalStats.thisWeek}</h3>
              <p>Journals This Week</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-section">
            <h2>Your Goals Overview</h2>
            {goals && goals.text ? (
              <div className="goal-overview">
                <div className="main-goal-card">
                  <h3>{goals.text}</h3>
                  {goals.description && <p>{goals.description}</p>}
                </div>

                {goals.subGoals && goals.subGoals.filter((g) => g && g.text).length > 0 ? (
                  <div className="goals-grid">
                    {goals.subGoals
                      .filter((g) => g && g.text)
                      .map((goal) => (
                        <div
                          key={goal.id}
                          className="goal-card"
                          onClick={() => handleGoalClick(goal)}
                        >
                          <h4>{goal.text}</h4>
                          {goal.description && (
                            <p className="goal-description">
                              {goal.description}
                            </p>
                          )}
                          <div className="goal-meta">
                            <span>
                              {goal.subGoals?.filter((sg) => sg && sg.text)
                                .length || 0}{" "}
                              sub-goals
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No primary goals yet. Start breaking down your main goal!</p>
                    <button
                      onClick={() => navigate("/goal-setting")}
                      className="action-button"
                    >
                      Add Primary Goals
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No goals yet</h3>
                <p>Start your journey by setting your first goal.</p>
                <button
                  onClick={() => navigate("/goal-setting")}
                  className="action-button"
                >
                  Set Your Main Goal
                </button>
              </div>
            )}
          </div>

          <div className="dashboard-section">
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              <button
                onClick={() => navigate("/goal-setting")}
                className="quick-action-btn"
              >
                <span className="action-icon">🎯</span>
                <span>Manage Goals</span>
              </button>
              <button
                onClick={() => navigate("/journal")}
                className="quick-action-btn"
              >
                <span className="action-icon">📝</span>
                <span>Write Journal</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Goal Summary Modal */}
      <GoalSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        goalText={selectedGoalText}
        journalSummary={journalSummary}
        childrenSummary={childrenSummary}
        journalEntries={journalEntries}
        loadingJournalSummary={loadingJournalSummary}
        loadingChildrenSummary={loadingChildrenSummary}
        loadingJournalEntries={loadingJournalEntries}
      />
    </div>
  );
};

export default Dashboard;
