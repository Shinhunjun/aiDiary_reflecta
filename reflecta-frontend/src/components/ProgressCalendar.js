import React, { useEffect, useState } from "react";
import "./ProgressCalendar.css";

const ProgressCalendar = ({ goalId, apiService }) => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (goalId) {
      loadHeatmapData();
    }
  }, [goalId]);

  const loadHeatmapData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getGoalProgressAnalytics(goalId);
      if (data.heatmapData) {
        setHeatmapData(data.heatmapData);
      }
    } catch (err) {
      console.error("Failed to load heatmap data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getIntensity = (count) => {
    if (count === 0) return "none";
    if (count <= 1) return "low";
    if (count <= 3) return "medium";
    if (count <= 5) return "high";
    return "very-high";
  };

  const getDateData = (dateString) => {
    return heatmapData.find((d) => d.date === dateString);
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split("T")[0];
      const data = getDateData(dateString);
      const count = data?.count || 0;
      const intensity = getIntensity(count);

      days.push({
        day,
        date: dateString,
        count,
        data,
        intensity,
        isToday: dateString === new Date().toISOString().split("T")[0],
      });
    }

    return days;
  };

  const changeMonth = (offset) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1)
    );
  };

  const handleDayClick = (dayData) => {
    if (dayData && dayData.count > 0) {
      setSelectedDate(dayData);
    } else {
      setSelectedDate(null);
    }
  };

  if (loading) {
    return (
      <div className="calendar-loading">
        <div className="loading-spinner"></div>
        <p>Loading activity calendar...</p>
      </div>
    );
  }

  const days = generateCalendarDays();
  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Calculate stats
  const totalDaysActive = heatmapData.length;
  const totalEntries = heatmapData.reduce((sum, d) => sum + d.count, 0);
  const totalTime = heatmapData.reduce((sum, d) => sum + d.totalTime, 0);
  const maxCount = Math.max(...heatmapData.map((d) => d.count), 0);

  return (
    <div className="progress-calendar">
      <div className="calendar-header">
        <h3>Activity Heatmap</h3>
        <div className="calendar-stats">
          <div className="stat-item">
            <span className="stat-value">{totalDaysActive}</span>
            <span className="stat-label">Active Days</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{totalEntries}</span>
            <span className="stat-label">Total Entries</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{Math.round(totalTime / 60)}h</span>
            <span className="stat-label">Time Invested</span>
          </div>
        </div>
      </div>

      <div className="calendar-navigation">
        <button className="month-nav" onClick={() => changeMonth(-1)}>
          ←
        </button>
        <h4>{monthName}</h4>
        <button
          className="month-nav"
          onClick={() => changeMonth(1)}
          disabled={currentMonth.getMonth() === new Date().getMonth()}
        >
          →
        </button>
      </div>

      <div className="calendar-grid">
        <div className="weekday-header">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-days">
          {days.map((dayData, index) => (
            <div
              key={index}
              className={`calendar-day ${
                dayData ? `intensity-${dayData.intensity}` : "empty"
              } ${dayData?.isToday ? "today" : ""} ${
                selectedDate?.date === dayData?.date ? "selected" : ""
              }`}
              onClick={() => handleDayClick(dayData)}
              title={
                dayData?.count > 0
                  ? `${dayData.count} entries on ${dayData.date}`
                  : ""
              }
            >
              {dayData && (
                <>
                  <span className="day-number">{dayData.day}</span>
                  {dayData.count > 0 && (
                    <span className="day-badge">{dayData.count}</span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="calendar-legend">
        <span className="legend-label">Less</span>
        <div className="legend-box intensity-none"></div>
        <div className="legend-box intensity-low"></div>
        <div className="legend-box intensity-medium"></div>
        <div className="legend-box intensity-high"></div>
        <div className="legend-box intensity-very-high"></div>
        <span className="legend-label">More</span>
      </div>

      {selectedDate && selectedDate.data && (
        <div className="day-details">
          <h4>
            {new Date(selectedDate.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h4>
          <div className="day-details-content">
            <div className="detail-item">
              <span className="detail-label">Entries:</span>
              <span className="detail-value">{selectedDate.data.count}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Time Spent:</span>
              <span className="detail-value">
                {selectedDate.data.totalTime} min
              </span>
            </div>
            {selectedDate.data.types && selectedDate.data.types.length > 0 && (
              <div className="detail-item">
                <span className="detail-label">Types:</span>
                <div className="detail-tags">
                  {selectedDate.data.types.map((type) => (
                    <span key={type} className="detail-tag">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {maxCount > 0 && (
        <div className="calendar-insights">
          <p>
            Your most productive day had <strong>{maxCount}</strong> progress{" "}
            {maxCount === 1 ? "entry" : "entries"}!
          </p>
          {totalDaysActive >= 7 && (
            <p>
              You've been active for <strong>{totalDaysActive}</strong> days.
              Keep up the consistency!
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressCalendar;
