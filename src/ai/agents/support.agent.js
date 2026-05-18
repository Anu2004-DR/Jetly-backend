const client = require("../openai/client");

async function supportAgent(userMessage) {
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: `
You are Jetly Support AI.

Help users with:
- cancellations
- refunds
- baggage
- delays
- account issues
- booking problems
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

module.exports = supportAgent;