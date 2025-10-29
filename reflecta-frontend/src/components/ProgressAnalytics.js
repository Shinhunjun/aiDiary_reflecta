import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import "./ProgressAnalytics.css";

const ProgressAnalytics = ({ goalId, apiService }) => {
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (goalId) {
      loadAnalytics();
      loadInsights();
    }
  }, [goalId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await apiService.getGoalProgressAnalytics(goalId);
      setAnalytics(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    try {
      const data = await apiService.getGoalProgressInsights(goalId);
      setInsights(data);
    } catch (err) {
      console.error("Failed to load insights:", err);
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return <div className="analytics-error">{error}</div>;
  }

  if (!analytics) {
    return (
      <div className="analytics-empty">
        <p>No analytics data available yet.</p>
        <p>Start tracking your progress to see insights!</p>
      </div>
    );
  }

  const COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#a4de6c",
    "#d0ed57",
  ];

  const moodColors = {
    happy: "#FFD700",
    excited: "#FF6B6B",
    calm: "#4ECDC4",
    grateful: "#95E1D3",
    neutral: "#C7CEEA",
    anxious: "#FFA07A",
    sad: "#B8B8D8",
    reflective: "#A8DADC",
  };

  return (
    <div className="progress-analytics">
      {/* Insights Section */}
      {insights && insights.insights && insights.insights.length > 0 && (
        <div className="insights-section">
          <h3>Smart Insights</h3>
          <div className="insights-grid">
            {insights.insights.map((insight, index) => (
              <div
                key={index}
                className={`insight-card ${insight.confidence}-confidence`}
              >
                <div className="insight-header">
                  <span className="insight-icon">{insight.icon}</span>
                  <span className="insight-type">{insight.category}</span>
                </div>
                <h4>{insight.title}</h4>
                <p>{insight.description}</p>
                <span className="insight-confidence">{insight.confidence}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Progress */}
      <div className="analytics-overview">
        <div className="overview-card">
          <h4>Overall Completion</h4>
          <div className="big-number">{analytics.overallCompletion}%</div>
          <p>
            {analytics.completedSubGoals} of {analytics.totalSubGoals} sub-goals
          </p>
        </div>
        {analytics.predictedCompletion && (
          <div className="overview-card">
            <h4>Predicted Completion</h4>
            <div className="prediction-date">
              {new Date(analytics.predictedCompletion).toLocaleDateString()}
            </div>
            <p>Based on current velocity</p>
          </div>
        )}
      </div>

      {/* Velocity Chart */}
      {analytics.velocityData && analytics.velocityData.length > 0 && (
        <div className="analytics-chart">
          <h3>Progress Velocity</h3>
          <p className="chart-description">
            Track your weekly progress rate and time investment
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.velocityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="week"
                label={{ value: "Week", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                yAxisId="left"
                label={{ value: "Entries", angle: -90, position: "insideLeft" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{
                  value: "Time (min)",
                  angle: 90,
                  position: "insideRight",
                }}
              />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                strokeWidth={2}
                name="Progress Entries"
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="timeSpent"
                stroke="#82ca9d"
                strokeWidth={2}
                name="Time Spent"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Mood Correlation */}
      {analytics.moodCorrelation && analytics.moodCorrelation.length > 0 && (
        <div className="analytics-chart">
          <h3>Mood & Progress Correlation</h3>
          <p className="chart-description">
            How your emotional state correlates with progress completion
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.moodCorrelation}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mood" />
              <YAxis
                label={{
                  value: "Avg Completion %",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgCompletion" name="Average Completion %">
                {analytics.moodCorrelation.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={moodColors[entry.mood] || COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Difficulty Distribution */}
      {analytics.difficultyStats && analytics.difficultyStats.length > 0 && (
        <div className="analytics-row">
          <div className="analytics-chart half-width">
            <h3>Difficulty Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.difficultyStats}
                  dataKey="count"
                  nameKey="difficulty"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.difficulty}: ${entry.count}`}
                >
                  {analytics.difficultyStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="analytics-chart half-width">
            <h3>Time by Difficulty</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.difficultyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="difficulty" />
                <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Bar dataKey="avgTimeSpent" fill="#8884d8" name="Avg Time (min)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Milestones */}
      {analytics.milestones && analytics.milestones.length > 0 && (
        <div className="milestones-section">
          <h3>Recent Milestones</h3>
          <div className="milestones-list">
            {analytics.milestones.slice(0, 5).map((milestone) => (
              <div key={milestone.id} className="milestone-item">
                <span className="milestone-emoji">
                  {milestone.emoji || "🎯"}
                </span>
                <div className="milestone-content">
                  <h4>{milestone.title}</h4>
                  <div className="milestone-meta">
                    <span className="milestone-category">
                      {milestone.category}
                    </span>
                    <span className="milestone-date">
                      {new Date(milestone.date).toLocaleDateString()}
                    </span>
                    <span className="milestone-completion">
                      {milestone.completionPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressAnalytics;
