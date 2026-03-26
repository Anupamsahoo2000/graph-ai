const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const callLLM = async (prompt) => {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from environment variables.");
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(30000)
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini API Error: ${res.status} ${res.statusText} - ${errorText}`);
    }

    const data = await res.json();
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No candidates returned from Gemini API.");
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("LLM Error:", error.message);
    throw error;
  }
};

module.exports = { callLLM };
