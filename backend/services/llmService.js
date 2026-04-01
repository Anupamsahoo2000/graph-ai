const axios = require("axios");

const callLLM = async (prompt) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from environment variables. Please add it to your deployed environment.");
  }

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { 
        headers: { "Content-Type": "application/json" },
        timeout: 30000 
      }
    );

    const data = res.data;
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No candidates returned from Gemini API.");
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("LLM Error:", error.message);
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(`Gemini API Error: ${error.response.data.error.message}`);
    }
    throw error;
  }
};

module.exports = { callLLM };
