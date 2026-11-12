
const express = require("express");

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "AI server key is not configured."
      });
    }

    const messages = req.body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Please send a message."
      });
    }

    const safeMessages = messages.slice(-20).map(m => {
      if (
        !["user", "assistant"].includes(m.role) ||
        typeof m.content !== "string"
      ) {
        throw new Error("Invalid message format.");
      }

      return {
        role: m.role,
        content: m.content.slice(0, 4000)
      };
    });

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL,
          instructions:
            "You are Nova AI, a helpful AI assistant. " +
            "Reply in the language used by the user. " +
            "Explain clearly and accurately.",
          input: safeMessages,
          max_output_tokens: 700
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      return res.status(502).json({
        error: "AI service error. Check server settings."
      });
    }

    const reply = data.output_text;

    if (!reply) {
      throw new Error("No text received from AI.");
    }

    res.json({ reply });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Server error. Please try again."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Nova AI server running on port " + PORT);
});
