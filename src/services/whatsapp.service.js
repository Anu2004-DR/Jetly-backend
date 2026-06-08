const axios = require("axios");

const sendBookingConfirmation = async ({
  phone,
  passengerName,
  pnr,
  flightNo,
}) => {
  // Skip if WhatsApp credentials are not configured
  if (
    !process.env.WHATSAPP_TOKEN ||
    !process.env.WHATSAPP_PHONE_ID ||
    !process.env.WHATSAPP_TEMPLATE
  ) {
    console.log(
      "⚠️ WhatsApp credentials not configured. Skipping WhatsApp notification."
    );
    return;
  }

  try {
    if (!phone) {
      console.log("⚠️ No phone number provided.");
      return;
    }

    // Convert phone number to WhatsApp format
    const formattedPhone = phone
      .toString()
      .replace(/\D/g, "")
      .replace(/^0+/, "");

    const whatsappPhone = formattedPhone.startsWith("91")
      ? formattedPhone
      : `91${formattedPhone}`;

    const response = await axios.post(
      `https://graph.facebook.com/v23.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: whatsappPhone,
        type: "template",
        template: {
          name: process.env.WHATSAPP_TEMPLATE,
          language: {
            code: "en",
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: passengerName || "Passenger",
                },
                {
                  type: "text",
                  text: pnr || "N/A",
                },
                {
                  type: "text",
                  text: flightNo || "N/A",
                },
              ],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ WhatsApp message sent successfully");
    console.log(response.data);

    return response.data;
  } catch (error) {
    console.error("❌ WhatsApp Error");

    if (error.response) {
      console.error(
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.error(error.message);
    }
  }
};

module.exports = {
  sendBookingConfirmation,
};