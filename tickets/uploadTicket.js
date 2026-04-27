const { PutObjectCommand } = require("@aws-sdk/client-s3");
const r2Client = require("../config/r2");

/**
 * Uploads a PDF buffer to Cloudflare R2.
 * Returns the public URL of the uploaded ticket.
 *
 * @param {Buffer} pdfBuffer
 * @param {number|string} bookingId
 * @returns {Promise<string>} public URL
 */
const uploadTicketToR2 = async (pdfBuffer, bookingId) => {
  const key = `tickets/JetlyXO_Ticket_${bookingId}.pdf`;

  await r2Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: pdfBuffer,
    ContentType: "application/pdf",
    // Makes the file publicly readable
    ACL: "public-read",
  }));

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
  console.log("✅ Ticket uploaded to R2:", publicUrl);
  return publicUrl;
};

module.exports = uploadTicketToR2;