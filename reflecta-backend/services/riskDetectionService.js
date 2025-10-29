/**
 * AI Risk Detection Service
 * Analyzes journal entries, mood patterns, and goal progress for mental health risk indicators
 */

const axios = require("axios");
const JournalEntry = require("../models/JournalEntry");
const GoalProgress = require("../models/GoalProgress");
const RiskAlert = require("../models/RiskAlert");
const User = require("../models/User");

/**
 * Analyze a journal entry for mental health risk factors
 * @param {string} userId - User ID
 * @param {string} entryId - Journal entry ID
 * @returns {Object|null} Risk assessment or null if no risk detected
 */
async function analyzeJournalEntry(userId, entryId) {
  try {
    // Fetch journal entry
    const entry = await JournalEntry.findById(entryId);
    if (!entry || entry.userId.toString() !== userId) {
      throw new Error("Journal entry not found");
    }

    // Check if user has risk monitoring enabled
    const user = await User.findById(userId).select("privacySettings");
    if (!user?.privacySettings?.riskMonitoring?.enabled) {
      return null; // User hasn't consented to risk monitoring
    }

    // Fetch recent entries for context (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEntries = await JournalEntry.find({
      userId,
      date: { $gte: sevenDaysAgo },
    })
      .sort({ date: -1 })
      .limit(10)
      .select("content mood date");

    // Build context for AI
    const contextSummary = recentEntries
      .map((e) => `[${e.date.toISOString().split("T")[0]}] Mood: ${e.mood}`)
      .join("\n");

    // Call OpenAI API for risk analysis
    const aiResponse = await callOpenAIForRiskAnalysis(
      entry.content,
      entry.mood,
      contextSummary
    );

    // If no risk detected, return null
    if (aiResponse.riskLevel === "none" || !aiResponse.riskLevel) {
      return null;
    }

    // Get all counselors
    const allCounselors = await User.find({ role: "counselor" }).select("_id");

    // Create risk alert - all counselors can see it
    const riskAlert = await RiskAlert.create({
      studentId: userId,
      riskLevel: aiResponse.riskLevel,
      riskFactors: aiResponse.riskFactors,
      triggerSource: "journal",
      triggerEntryId: entryId,
      aiAnalysis: {
        summary: aiResponse.summary,
        keyPhrases: aiResponse.keyPhrases || [],
        moodTrend: aiResponse.moodTrend,
        recommendations: aiResponse.recommendations || [],
        confidence: aiResponse.confidence,
      },
      assignedCounselors: allCounselors.map((counselor) => ({
        counselorId: counselor._id,
        assignedAt: new Date(),
      })),
    });

    // Send notifications based on risk level
    await sendRiskNotifications(riskAlert);

    return riskAlert;
  } catch (error) {
    console.error("Risk analysis error:", error);
    throw error;
  }
}

/**
 * Analyze mood patterns for risk detection
 * @param {string} userId - User ID
 * @returns {Object|null} Risk assessment or null if no risk detected
 */
async function analyzeMoodPattern(userId) {
  try {
    // Check if user has risk monitoring enabled
    const user = await User.findById(userId).select("privacySettings");
    if (!user?.privacySettings?.riskMonitoring?.enabled) {
      return null;
    }

    // Fetch last 30 days of journal entries
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const entries = await JournalEntry.find({
      userId,
      date: { $gte: thirtyDaysAgo },
    })
      .sort({ date: 1 })
      .select("mood date");

    if (entries.length < 5) {
      return null; // Not enough data
    }

    // Analyze mood trend
    const moodScores = {
      happy: 5,
      excited: 5,
      grateful: 4,
      calm: 4,
      neutral: 3,
      reflective: 3,
      anxious: 2,
      sad: 1,
    };

    const scores = entries.map((e) => moodScores[e.mood] || 3);
    const recentAvg = scores.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, scores.length);
    const overallAvg = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Check for significant mood decline
    const decline = overallAvg - recentAvg;

    if (decline < 1.5) {
      return null; // No significant decline
    }

    // Check for consecutive negative moods
    const recentMoods = entries.slice(-7).map((e) => e.mood);
    const negativeCount = recentMoods.filter((m) =>
      ["anxious", "sad"].includes(m)
    ).length;

    let riskLevel = "low";
    if (decline >= 2.5 || negativeCount >= 5) {
      riskLevel = "high";
    } else if (decline >= 2.0 || negativeCount >= 4) {
      riskLevel = "medium";
    }

    // Get all counselors
    const allCounselors = await User.find({ role: "counselor" }).select("_id");

    // Create risk alert - all counselors can see it
    const riskAlert = await RiskAlert.create({
      studentId: userId,
      riskLevel,
      riskFactors: [
        {
          type: "mood_decline",
          severity: riskLevel,
          description: `Mood has declined by ${decline.toFixed(1)} points over the last 7 days. ${negativeCount} of last 7 entries show negative mood.`,
        },
      ],
      triggerSource: "mood_pattern",
      aiAnalysis: {
        summary: `Detected sustained mood decline over the past week.`,
        moodTrend: `Recent average: ${recentAvg.toFixed(1)}/5, Overall average: ${overallAvg.toFixed(1)}/5`,
        recommendations: [
          "Check in with student about recent stressors",
          "Review recent journal entries for context",
          "Consider scheduling a counseling session",
        ],
        confidence: 0.8,
      },
      assignedCounselors: allCounselors.map((counselor) => ({
        counselorId: counselor._id,
        assignedAt: new Date(),
      })),
    });

    await sendRiskNotifications(riskAlert);

    return riskAlert;
  } catch (error) {
    console.error("Mood pattern analysis error:", error);
    throw error;
  }
}

/**
 * Call OpenAI API for risk analysis
 * @param {string} content - Journal entry content
 * @param {string} mood - Current mood
 * @param {string} context - Recent mood history
 * @returns {Object} AI risk assessment
 */
async function callOpenAIForRiskAnalysis(content, mood, context) {
  const prompt = `You are a mental health risk assessment AI. Analyze the following journal entry for mental health risk indicators.

CURRENT ENTRY:
Mood: ${mood}
Content: ${content}

RECENT MOOD HISTORY (last 7 days):
${context}

Analyze for the following risk factors:
- Suicidal ideation (CRITICAL)
- Self-harm indications (CRITICAL)
- Severe depression symptoms (HIGH)
- Anxiety/panic indicators (MEDIUM)
- Social isolation patterns (MEDIUM)
- Academic stress (LOW)
- Sleep issues (LOW)

Return a JSON response with this structure:
{
  "riskLevel": "none|low|medium|high|critical",
  "riskFactors": [
    {
      "type": "suicidal_ideation|self_harm_indication|mood_decline|negative_keywords|isolation_pattern|stress_increase|sleep_issues|academic_struggle",
      "severity": "low|medium|high",
      "description": "Brief description of the indicator"
    }
  ],
  "summary": "Brief summary of mental health status",
  "keyPhrases": ["key phrase 1", "key phrase 2"],
  "moodTrend": "improving|stable|declining",
  "recommendations": ["recommendation 1", "recommendation 2"],
  "confidence": 0.0-1.0
}

IMPORTANT:
- If you detect suicidal ideation or self-harm, set riskLevel to "critical"
- Be sensitive but accurate
- If no significant risk, set riskLevel to "none"
- Only return the JSON, no additional text`;

  try {
    const response = await axios.post(
      process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a mental health risk assessment expert. Respond only with valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data.choices[0].message.content.trim();

    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = result.match(/```json?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    return parsed;
  } catch (error) {
    console.error("OpenAI API error:", error.response?.data || error.message);

    // Fallback: simple keyword-based detection
    return fallbackRiskDetection(content, mood);
  }
}

/**
 * Fallback risk detection using keyword matching
 * Used when AI API is unavailable
 */
function fallbackRiskDetection(content, mood) {
  const contentLower = content.toLowerCase();

  // Critical keywords
  const criticalKeywords = [
    "suicide", "kill myself", "want to die", "end it all", "not worth living",
    "self harm", "cut myself", "hurt myself"
  ];

  // High risk keywords
  const highKeywords = [
    "hopeless", "worthless", "no point", "give up", "can't go on",
    "unbearable", "too much pain"
  ];

  // Check for critical risk
  for (const keyword of criticalKeywords) {
    if (contentLower.includes(keyword)) {
      return {
        riskLevel: "critical",
        riskFactors: [
          {
            type: contentLower.includes("harm") ? "self_harm_indication" : "suicidal_ideation",
            severity: "high",
            description: `Detected critical keyword: "${keyword}"`,
          },
        ],
        summary: "Critical risk detected - immediate intervention recommended",
        keyPhrases: [keyword],
        moodTrend: "declining",
        recommendations: [
          "URGENT: Contact student immediately",
          "Consider emergency mental health services",
          "Notify appropriate authorities per protocol",
        ],
        confidence: 0.7,
      };
    }
  }

  // Check for high risk
  let highRiskCount = 0;
  for (const keyword of highKeywords) {
    if (contentLower.includes(keyword)) {
      highRiskCount++;
    }
  }

  if (highRiskCount >= 2 || (["sad", "anxious"].includes(mood) && highRiskCount >= 1)) {
    return {
      riskLevel: "high",
      riskFactors: [
        {
          type: "mood_decline",
          severity: "high",
          description: "Multiple negative indicators detected",
        },
      ],
      summary: "High risk indicators present",
      keyPhrases: highKeywords.filter(k => contentLower.includes(k)),
      moodTrend: "declining",
      recommendations: [
        "Schedule counseling session soon",
        "Monitor closely over next few days",
      ],
      confidence: 0.6,
    };
  }

  return {
    riskLevel: "none",
    summary: "No significant risk detected",
    confidence: 0.5,
  };
}

/**
 * Send notifications based on risk level
 * @param {Object} riskAlert - Risk alert document
 */
async function sendRiskNotifications(riskAlert) {
  try {
    // Populate student and counselor info
    const alert = await RiskAlert.findById(riskAlert._id)
      .populate("studentId", "name email")
      .populate("assignedCounselors.counselorId", "name email");

    if (!alert.assignedCounselors || alert.assignedCounselors.length === 0) {
      console.warn("No counselors assigned to this alert");
      return;
    }

    // Determine notification channels based on risk level
    const channels = ["in_app"];

    if (alert.riskLevel === "high" || alert.riskLevel === "critical") {
      channels.push("email");
    }

    if (alert.riskLevel === "critical") {
      channels.push("sms");
    }

    // Send notifications
    for (const channel of channels) {
      for (const assignment of alert.assignedCounselors) {
        const counselor = assignment.counselorId;

        if (channel === "email") {
          // TODO: Implement email sending
          console.log(`[EMAIL] Sending ${alert.riskLevel} risk alert to ${counselor.email}`);
        } else if (channel === "sms") {
          // TODO: Implement SMS sending
          console.log(`[SMS] Sending CRITICAL alert to counselor ${counselor.name}`);
        } else if (channel === "in_app") {
          console.log(`[IN-APP] Alert ${alert._id} for counselor ${counselor.name}`);
        }

        // Record notification
        alert.notificationsSent.push({
          type: channel,
          sentAt: new Date(),
          recipient: counselor.email,
        });
      }
    }

    await alert.save();
  } catch (error) {
    console.error("Notification error:", error);
  }
}

module.exports = {
  analyzeJournalEntry,
  analyzeMoodPattern,
};
