// This is a mock API endpoint for demonstration
// In production, this would be a proper backend API

const mockResponses = [
  "That's a great reflection! How did that make you feel?",
  "I can see you're processing some important thoughts. What would you like to explore further?",
  "It sounds like you had an interesting experience. What did you learn from it?",
  "I appreciate you sharing that with me. How do you think this relates to your goals?",
  "That's a thoughtful observation. What would you like to focus on next?",
  "I can sense some growth in your thinking. What patterns do you notice?",
  "Thank you for being so open. What questions do you have about this?",
  "I'm here to help you reflect deeper. What aspects would you like to explore?",
  "That's a valuable insight. How might you apply this learning?",
  "I can see you're developing self-awareness. What's your next step?",
];

// Mock API response
const mockAPI = (req, res) => {
  if (req.method === "POST") {
    const { message } = req.body;

    // Simulate API delay
    setTimeout(() => {
      const randomResponse =
        mockResponses[Math.floor(Math.random() * mockResponses.length)];

      res.status(200).json({
        message: randomResponse,
        timestamp: new Date().toISOString(),
      });
    }, 1000 + Math.random() * 2000); // 1-3 second delay
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};

// For now, we'll use a simple fetch-based approach in the frontend
// This file is just for reference - the actual implementation will be in the Chat component
