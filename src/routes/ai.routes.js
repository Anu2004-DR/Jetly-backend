const express = require("express");
const router = express.Router();

const client = require("../ai/openai/client");

const { SYSTEM_PROMPT } = require("../ai/openai/prompts");

const { tools } = require("../ai/openai/tools");

const streamChat = require("../ai/openai/stream");

const {
  saveMessage,
  getConversation,
} = require("../ai/openai/memory");

// ======================================================
// MOCK TOOL FUNCTIONS
// Replace these with real services later
// ======================================================

async function searchFlights(args) {
  const { from, to, departureDate } = args;

  return [
    {
      airline: "IndiGo",
      from,
      to,
      departureDate,
      price: 4500,
      duration: "2h 30m",
    },
    {
      airline: "Air India",
      from,
      to,
      departureDate,
      price: 5200,
      duration: "2h 45m",
    },
  ];
}

async function searchHotels(args) {
  const { city } = args;

  return [
    {
      name: "Grand Palace Hotel",
      city,
      price: 3500,
      rating: 4.5,
    },
    {
      name: "Elite Stay",
      city,
      price: 2800,
      rating: 4.2,
    },
  ];
}

async function planTrip(args) {
  const { destination, days, budget } = args;

  return {
    destination,
    days,
    budget,
    itinerary: [
      "Day 1 - Arrival and local sightseeing",
      "Day 2 - Explore tourist attractions",
      "Day 3 - Adventure activities",
      "Day 4 - Shopping and food tour",
    ],
  };
}

// ======================================================
// NORMAL AI CHAT
// ======================================================

router.post("/chat", async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // SAVE USER MESSAGE
    if (userId) {
      saveMessage(userId, "user", message);
    }

    // GET PREVIOUS CONVERSATION
    const previousMessages = userId
      ? getConversation(userId)
      : [];

    const messages = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },

      ...previousMessages,

      {
        role: "user",
        content: message,
      },
    ];

    // ======================================================
    // OPENAI REQUEST
    // ======================================================

    let response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
      tools,
      tool_choice: "auto",
    });

    let assistantMessage = response.choices[0].message;

    // ======================================================
    // TOOL CALLING
    // ======================================================

    if (assistantMessage.tool_calls) {
      messages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;

        const args = JSON.parse(toolCall.function.arguments);

        let result;

        // SEARCH FLIGHTS
        if (functionName === "searchFlights") {
          result = await searchFlights(args);
        }

        // SEARCH HOTELS
        else if (functionName === "searchHotels") {
          result = await searchHotels(args);
        }

        // PLAN TRIP
        else if (functionName === "planTrip") {
          result = await planTrip(args);
        }

        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: JSON.stringify(result),
        });
      }

      // ======================================================
      // FINAL AI RESPONSE AFTER TOOL DATA
      // ======================================================

      response = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages,
      });

      assistantMessage = response.choices[0].message;
    }

    // SAVE ASSISTANT MESSAGE
    if (userId) {
      saveMessage(
        userId,
        "assistant",
        assistantMessage.content
      );
    }

    return res.json({
      success: true,
      reply: assistantMessage.content,
    });

  } catch (error) {
    console.error("AI CHAT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "AI chat failed",
      error: error.message,
    });
  }
});

// ======================================================
// STREAMING CHAT
// ======================================================

router.post("/stream", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages) {
      return res.status(400).json({
        success: false,
        message: "Messages are required",
      });
    }

    await streamChat(messages, res);

  } catch (error) {
    console.error("STREAM ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Streaming failed",
    });
  }
});

// ======================================================
// CLEAR MEMORY
// ======================================================

router.delete("/memory/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const memoryStore = require("../ai/openai/memory");

    memoryStore.clearConversation(userId);

    return res.json({
      success: true,
      message: "Memory cleared",
    });

  } catch (error) {
    console.error("MEMORY CLEAR ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to clear memory",
    });
  }
});

module.exports = router;