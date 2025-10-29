import React, { useEffect, useState } from "react";
import "./MilestoneTimeline.css";

const MilestoneTimeline = ({ goalId, apiService }) => {
  const [milestones, setMilestones] = useState([]);
  const [allProgress, setAllProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, milestone, completion

  useEffect(() => {
    if (goalId) {
      loadTimeline();
    }
  }, [goalId]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const [analyticsData, progressData] = await Promise.all([
        apiService.getGoalProgressAnalytics(goalId),
        apiService.getGoalProgress(goalId),
      ]);

      if (analyticsData.milestones) {
        setMilestones(analyticsData.milestones);
      }
      if (progressData) {
        setAllProgress(progressData);
      }
    } catch (err) {
      console.error("Failed to load timeline:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTimelineItems = () => {
    let items = [];

    if (filter === "all") {
      items = allProgress;
    } else if (filter === "milestone") {
      items = allProgress.filter((item) => item.isMilestone);
    } else if (filter === "completion") {
      items = allProgress.filter(
        (item) => item.progressType === "completion" || item.isMilestone
      );
    }

    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getProgressTypeIcon = (type) => {
    const icons = {
      milestone: "🎯",
      checkin: "✓",
      completion: "🎉",
      reflection: "💭",
    };
    return icons[type] || "��";
  };

  const getMilestoneColor = (category) => {
    const colors = {
      quarter: "#74b9ff",
      half: "#a29bfe",
      "three-quarter": "#fd79a8",
      complete: "#00b894",
      custom: "#6c5ce7",
    };
    return colors[category] || "#dfe6e9";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="timeline-loading">
        <div className="loading-spinner"></div>
        <p>Loading timeline...</p>
      </div>
    );
  }

  const timelineItems = getTimelineItems();

  return (
    <div className="milestone-timeline">
      <div className="timeline-header">
        <h3>Progress Timeline</h3>
        <div className="timeline-filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === "milestone" ? "active" : ""}`}
            onClick={() => setFilter("milestone")}
          >
            Milestones
          </button>
          <button
            className={`filter-btn ${filter === "completion" ? "active" : ""}`}
            onClick={() => setFilter("completion")}
          >
            Completions
          </button>
        </div>
      </div>

      {timelineItems.length === 0 ? (
        <div className="timeline-empty">
          <p>No progress entries yet. Start tracking to see your timeline!</p>
        </div>
      ) : (
        <div className="timeline-container">
          <div className="timeline-line"></div>
          {timelineItems.map((item, index) => {
            const isMilestone = item.isMilestone || item.progressType === "completion";
            const icon = item.celebrationEmoji || getProgressTypeIcon(item.progressType);
            const color = isMilestone
              ? getMilestoneColor(item.milestoneCategory)
              : "#dfe6e9";

            return (
              <div
                key={item._id || index}
                className={`timeline-item ${isMilestone ? "milestone" : "regular"}`}
              >
                <div
                  className="timeline-marker"
                  style={{
                    background: color,
                    boxShadow: isMilestone
                      ? `0 0 0 4px rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.2)`
                      : "none",
                  }}
                >
                  <span className="marker-icon">{icon}</span>
                </div>

                <div className="timeline-content">
                  <div className="timeline-card">
                    <div className="card-header">
                      <h4>{item.milestoneTitle || item.title}</h4>
                      <span className="card-date">{formatDate(item.date)}</span>
                    </div>

                    <p className="card-description">{item.description}</p>

                    <div className="card-meta">
                      {item.progressType && (
                        <span className={`meta-badge ${item.progressType}`}>
                          {item.progressType}
                        </span>
                      )}
                      {item.mood && (
                        <span className="meta-badge mood">
                          {item.mood}
                        </span>
                      )}
                      {item.difficulty && (
                        <span className={`meta-badge difficulty-${item.difficulty}`}>
                          {item.difficulty}
                        </span>
                      )}
                      {item.timeSpent > 0 && (
                        <span className="meta-badge time">
                          {item.timeSpent}min
                        </span>
                      )}
                      {item.completionPercentage > 0 && (
                        <span className="meta-badge completion">
                          {item.completionPercentage}%
                        </span>
                      )}
                    </div>

                    {item.tags && item.tags.length > 0 && (
                      <div className="card-tags">
                        {item.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="tag">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.notes && (
                      <div className="card-notes">
                        <strong>Notes:</strong> {item.notes}
                      </div>
                    )}

                    {isMilestone && (
                      <div className="milestone-badge">
                        <span className="milestone-icon">🏆</span>
                        <span>Milestone Achievement</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Timeline end marker */}
          <div className="timeline-end">
            <div className="timeline-marker end-marker">
              <span className="marker-icon">🌱</span>
            </div>
            <div className="timeline-content">
              <p className="timeline-start-text">Your journey begins here</p>
            </div>
          </div>
        </div>
      )}

      {milestones.length > 0 && (
        <div className="milestone-summary">
          <h4>Milestone Summary</h4>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-number">{milestones.length}</div>
              <div className="summary-label">Total Milestones</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">
                {milestones.filter((m) => m.category === "complete").length}
              </div>
              <div className="summary-label">Completions</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">
                {allProgress.filter((p) => p.progressType === "completion").length}
              </div>
              <div className="summary-label">Total Achievements</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneTimeline;
