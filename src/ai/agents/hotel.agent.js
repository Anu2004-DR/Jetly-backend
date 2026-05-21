const client = require("../openai/client");

async function hotelAgent(userMessage) {
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: `
You are Jetly Hotel AI.

Recommend hotels intelligently based on:
- price
- location
- travel type
- amenities
- ratings
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

module.exports = hotelAgent;