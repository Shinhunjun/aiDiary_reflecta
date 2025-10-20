import React from 'react';
import './Timeline.css';

const Timeline = ({ goals }) => {
  const getGoalsByDate = () => {
    const allGoals = Object.values(goals).flat();
    const sortedGoals = allGoals.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return sortedGoals;
  };

  const renderTimeline = () => {
    const sortedGoals = getGoalsByDate();

    return (
      <div className="timeline">
        {sortedGoals.map((goal, index) => (
          <div key={index} className="timeline-item">
            <div className="timeline-content">
              <span className="timeline-date">{new Date(goal.createdAt).toLocaleDateString()}</span>
              <p>{goal.text}</p>
              <span className="timeline-category">{goal.category}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="timeline-container">
      <h2>Goals Timeline</h2>
      {renderTimeline()}
    </div>
  );
};

export default Timeline;
