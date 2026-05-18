const client = require("../openai/client");

async function itineraryAgent(userMessage) {
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: `
You are Jetly Itinerary AI.

Create:
- travel plans
- day-wise itineraries
- budget plans
- destination recommendations
        `,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  return response.choices[0].message.content;
}

module.exports = itineraryAgent;