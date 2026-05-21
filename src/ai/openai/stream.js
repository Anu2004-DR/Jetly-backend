const client = require("./client");

async function streamChat(messages, res) {
  try {

    const stream =
      await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages,
        stream: true,
      });

    res.setHeader(
      "Content-Type",
      "text/plain"
    );

    res.setHeader(
      "Transfer-Encoding",
      "chunked"
    );

    for await (const chunk of stream) {

      const content =
        chunk.choices?.[0]?.delta?.content;

      if (content) {
        res.write(content);
      }
    }

    res.end();

  } catch (error) {

    console.error(
      "STREAM ERROR:",
      error
    );

    if (!res.headersSent) {

      res.status(500).json({
        success: false,
        message: "Streaming failed",
      });
    }
  }
}

module.exports = streamChat;