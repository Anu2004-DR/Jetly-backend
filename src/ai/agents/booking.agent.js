const client = require("../openai/client");
const { SYSTEM_PROMPT } = require("../openai/prompts");

async function bookingAgent(userMessage) {
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: `
${SYSTEM_PROMPT}

You specialize in:
- bookings
- cancellations
- refunds
- ticket modifications
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

module.exports = bookingAgent;