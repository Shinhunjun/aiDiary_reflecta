import React from "react";
import "./WordCloud.css";

const WordCloud = ({ words }) => {
  if (!words || words.length === 0) {
    return <div className="wordcloud-empty">No words to display</div>;
  }

  // Normalize font sizes based on word frequency
  const maxValue = Math.max(...words.map((w) => w.value));
  const minValue = Math.min(...words.map((w) => w.value));
  const range = maxValue - minValue || 1;

  const getFontSize = (value) => {
    const normalized = (value - minValue) / range;
    return 12 + normalized * 32; // 12px to 44px
  };

  const getColor = (index) => {
    const colors = [
      "#6366f1",
      "#8b5cf6",
      "#ec4899",
      "#f59e0b",
      "#10b981",
      "#3b82f6",
      "#14b8a6",
      "#f97316",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="wordcloud-container">
      {words.map((word, index) => (
        <span
          key={`${word.text}-${index}`}
          className="wordcloud-word"
          style={{
            fontSize: `${getFontSize(word.value)}px`,
            color: getColor(index),
            opacity: 0.7 + (word.value / maxValue) * 0.3,
          }}
          title={`${word.text}: ${word.value} times`}
        >
          {word.text}
        </span>
      ))}
    </div>
  );
};

export default WordCloud;
