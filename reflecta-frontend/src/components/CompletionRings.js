import React, { useEffect, useState } from "react";
import "./CompletionRings.css";

const CompletionRings = ({ goalId, mandalartData, apiService }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (goalId) {
      loadAnalytics();
    }
  }, [goalId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await apiService.getGoalProgressAnalytics(goalId);
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSubGoalCompletion = (subGoal) => {
    if (!subGoal) return 0;
    if (!subGoal.subGoals || subGoal.subGoals.length === 0) {
      return subGoal.completed ? 100 : 0;
    }
    const completed = subGoal.subGoals.filter((sg) => sg && sg.completed).length;
    return Math.round((completed / subGoal.subGoals.length) * 100);
  };

  const getCompletionColor = (percentage) => {
    if (percentage === 100) return "#00b894";
    if (percentage >= 75) return "#55efc4";
    if (percentage >= 50) return "#fdcb6e";
    if (percentage >= 25) return "#fab1a0";
    return "#dfe6e9";
  };

  const getCompletionGradient = (percentage) => {
    if (percentage === 100) return "linear-gradient(135deg, #00b894, #55efc4)";
    if (percentage >= 75) return "linear-gradient(135deg, #6c5ce7, #a29bfe)";
    if (percentage >= 50) return "linear-gradient(135deg, #fdcb6e, #ffeaa7)";
    if (percentage >= 25) return "linear-gradient(135deg, #fab1a0, #ffccbc)";
    return "linear-gradient(135deg, #dfe6e9, #f1f3f5)";
  };

  if (loading) {
    return (
      <div className="completion-rings-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!mandalartData) {
    return (
      <div className="completion-rings-empty">
        <p>No goal data available</p>
      </div>
    );
  }

  const mainGoalCompletion = analytics?.overallCompletion || 0;
  const subGoals = mandalartData.subGoals || [];

  return (
    <div className="completion-rings">
      <div className="rings-header">
        <h3>Goal Completion Overview</h3>
        <p>Visual progress tracking for all your goals</p>
      </div>

      {/* Main Goal Ring */}
      <div className="main-ring-container">
        <div className="completion-ring large">
          <svg viewBox="0 0 200 200">
            <defs>
              <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop
                  offset="0%"
                  style={{ stopColor: "#6c5ce7", stopOpacity: 1 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: "#a29bfe", stopOpacity: 1 }}
                />
              </linearGradient>
            </defs>
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#f0f0f0"
              strokeWidth="20"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="url(#mainGradient)"
              strokeWidth="20"
              strokeDasharray={`${(mainGoalCompletion / 100) * 502.4} 502.4`}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              className="progress-circle"
            />
          </svg>
          <div className="ring-content">
            <div className="ring-percentage">{Math.round(mainGoalCompletion)}%</div>
            <div className="ring-label">Main Goal</div>
            <div className="ring-sublabel">{mandalartData.text}</div>
          </div>
        </div>

        {analytics && (
          <div className="main-goal-stats">
            <div className="stat-box">
              <div className="stat-number">{analytics.completedSubGoals}</div>
              <div className="stat-text">Completed</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-box">
              <div className="stat-number">
                {analytics.totalSubGoals - analytics.completedSubGoals}
              </div>
              <div className="stat-text">Remaining</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-box">
              <div className="stat-number">{analytics.totalSubGoals}</div>
              <div className="stat-text">Total</div>
            </div>
          </div>
        )}
      </div>

      {/* Sub Goals Rings */}
      {subGoals.length > 0 && (
        <div className="sub-rings-container">
          <h4>Sub-Goals Progress</h4>
          <div className="sub-rings-grid">
            {subGoals.map((subGoal, index) => {
              if (!subGoal) return null;
              const completion = calculateSubGoalCompletion(subGoal);
              const gradientId = `gradient-${index}`;

              return (
                <div key={subGoal.id || index} className="completion-ring small">
                  <svg viewBox="0 0 120 120">
                    <defs>
                      <linearGradient
                        id={gradientId}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          style={{
                            stopColor:
                              completion === 100 ? "#00b894" : "#6c5ce7",
                            stopOpacity: 1,
                          }}
                        />
                        <stop
                          offset="100%"
                          style={{
                            stopColor:
                              completion === 100 ? "#55efc4" : "#a29bfe",
                            stopOpacity: 1,
                          }}
                        />
                      </linearGradient>
                    </defs>
                    {/* Background circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#f0f0f0"
                      strokeWidth="12"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={`url(#${gradientId})`}
                      strokeWidth="12"
                      strokeDasharray={`${(completion / 100) * 314} 314`}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                      className="progress-circle"
                    />
                    {completion === 100 && (
                      <text
                        x="60"
                        y="60"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="32"
                      >
                        ✓
                      </text>
                    )}
                  </svg>
                  <div className="ring-content">
                    <div className="ring-percentage-small">{completion}%</div>
                    <div className="ring-label-small">
                      {subGoal.text || `Goal ${index + 1}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Legend */}
      <div className="completion-legend">
        <div className="legend-item">
          <div
            className="legend-circle"
            style={{ background: getCompletionGradient(100) }}
          ></div>
          <span>100% Complete</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-circle"
            style={{ background: getCompletionGradient(75) }}
          ></div>
          <span>75-99%</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-circle"
            style={{ background: getCompletionGradient(50) }}
          ></div>
          <span>50-74%</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-circle"
            style={{ background: getCompletionGradient(25) }}
          ></div>
          <span>25-49%</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-circle"
            style={{ background: getCompletionGradient(0) }}
          ></div>
          <span>0-24%</span>
        </div>
      </div>
    </div>
  );
};

export default CompletionRings;
