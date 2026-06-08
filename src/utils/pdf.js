const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

// ─────────────────────────────────────────────
// QR UTILITY — builds payload + returns Buffer
// ─────────────────────────────────────────────

/**
 * Builds a compact, scannable QR payload from the booking object.
 * Keep it lean — QR density increases with payload size.
 *
 * @param {Object} booking
 * @returns {string} JSON string to encode
 */
const buildQRPayload = (booking) => {
  const payload = {
    bookingId: booking.id,
    pnr: booking.pnr || "N/A",
    passenger: booking.passengerName || "N/A",
    type: booking.bookingType,
    from: booking.fromCity || "N/A",
    to: booking.toCity || "N/A",
    date: booking.date
      ? new Date(booking.date).toLocaleDateString()
      : new Date().toLocaleDateString(),
    amount: booking.totalPrice,
    status: "CONFIRMED",
  };

  return JSON.stringify(payload);
};

/**
 * Generates a QR code PNG as an in-memory Buffer.
 * Never writes to disk. Returns null on failure so the
 * PDF can still be generated without the QR code.
 *
 * @param {Object} booking
 * @returns {Promise<Buffer|null>}
 */
const generateQRBuffer = async (booking) => {
  try {
    const qrString = `http://192.168.1.10:5000/api/validate?pnr=${booking.pnr}`;

    // Safety guard: QR byte mode cap is 2953 bytes (Version 40)
    if (qrString.length > 2953) {
      throw new Error(`QR payload too large: ${qrString.length} bytes`);
    }

    const buffer = await QRCode.toBuffer(qrString, {
      type: "png",
      errorCorrectionLevel: "M", // Medium — good density vs. error recovery tradeoff
      margin: 1,                  // Minimal quiet zone; PDFKit adds its own spacing
      scale: 8,                   // 8px per module → ~256px output, crisp at any print size
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    return buffer;
  } catch (err) {
    // Non-fatal: log and let the ticket generate without QR
    console.error("⚠️  QR generation failed (ticket will still be created):", err.message);
    return null;
  }
};

// ─────────────────────────────────────────────
// MAIN — generateTicketPDF
// ─────────────────────────────────────────────

/**
 * Generates a JetlyXO PDF ticket with an embedded QR code.
 * Preserves your existing layout exactly; QR is added in the
 * bottom-right of the ticket area, above the footer note.
 *
 * @param {Object} booking - Booking record from your DB/controller
 * @returns {Promise<string>} Resolves with the absolute file path
 */
const generateTicketPDF = async (booking) => {
  // ── Step 1: Generate QR buffer BEFORE opening the PDF stream.
  //    If QR fails, we still proceed — qrBuffer will be null.
  console.log("BOOKING DATA:");
console.log(JSON.stringify(booking, null, 2));
  const qrBuffer = await generateQRBuffer(booking);

  return new Promise((resolve, reject) => {
    try {
      // ── Step 2: Ensure tickets directory exists
      const ticketsDir = path.join(__dirname, "../../tickets");
      if (!fs.existsSync(ticketsDir)) {
        fs.mkdirSync(ticketsDir, { recursive: true });
      }

      const filePath = path.join(
        ticketsDir,
        `JetlyXO_Ticket_${booking.id}.pdf`
      );

      const doc = new PDFDocument({
  size: "A4",
  margin: 0,
});
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Background
doc.rect(0, 0, 595, 842).fill("#081225");

// White Card
doc.roundedRect(25, 25, 545, 790, 20)
   .fillAndStroke("white", "#081225");

// Header
doc.roundedRect(25, 25, 545, 130, 20)
   .fill("#2563EB");

doc.fillColor("white")
   .font("Helvetica-Bold")
   .fontSize(28)
   .text("JETLY E-TICKET", 50, 60);

doc.font("Helvetica")
   .fontSize(14)
   .text("Travel smarter. Travel faster.", 50, 100);

doc.text(
  `PNR: ${booking.pnr || "N/A"}`,
  350,
  60,
  {
    width: 180,
    align: "right"
  }
);
doc.fillColor("#22C55E")
   .font("Helvetica-Bold")
   .text("STATUS: CONFIRMED", 400, 95);

doc.fillColor("black");

// Passenger
doc.fillColor("black");

doc.fontSize(15)
   .font("Helvetica")
   .text("Passenger Name", 60, 190);

doc.font("Helvetica-Bold")
   .fontSize(24)
   .text(
      booking.passengerName || "Passenger",
      60,
      220,
      {
         width: 470,
         ellipsis: true
      }
   );

// Journey
doc.font("Helvetica")
   .fontSize(15)
   .text("Journey", 60, 310);

doc.font("Helvetica-Bold")
   .fontSize(28)
   .text(booking.fromCity || "Bangalore", 60, 350);

doc.strokeColor("#999999");
doc.moveTo(240, 370)
   .lineTo(360, 370)
   .stroke();

doc.fontSize(20)
   .text(">", 295, 358);

doc.fontSize(28)
   .text(booking.toCity || "Delhi", 390, 350);

doc.font("Helvetica")
   .fontSize(16)
   .text(booking.fromCode || "BLR", 60, 395);

doc.text(booking.toCode || "DEL", 390, 395);

// Details Box
doc.roundedRect(60, 450, 475, 140, 10)
   .stroke("#DADCE0");

doc.fillColor("#666")
   .fontSize(12);

doc.text("Booking ID", 90, 480);
doc.text("Type", 250, 480);
doc.text("Fare", 400, 480);

doc.fillColor("black")
   .fontSize(16);

doc.text(String(booking.id), 90, 510);
doc.text(booking.bookingType || "FLIGHT", 250, 510);
doc.text(`₹${booking.totalPrice || 0}`, 400, 510);

doc.fillColor("#666")
   .fontSize(12);

doc.text("Date", 90, 550);
doc.text("Time", 250, 550);
doc.text("Seat", 400, 550);

doc.fillColor("black")
   .fontSize(16);

doc.text(
  booking.date
    ? new Date(booking.date).toLocaleDateString("en-IN")
    : "N/A",
  90,
  575
);

doc.text(
  booking.time || "09:30 PM",
  250,
  575
);

doc.text(
  booking.seat || "A1",
  400,
  575
);

// QR
if (qrBuffer) {
  doc.image(qrBuffer, 215, 610, {
    width: 150,
    height: 150,
  });

  doc.fontSize(12)
     .fillColor("black")
     .text(
       "Scan to verify ticket",
       215,
       770,
       {
         width: 150,
         align: "center",
       }
     );
}

// Footer
doc.fontSize(10)
   .fillColor("#666")
   .text(
   "Please carry valid ID proof during travel.",
   60,
   790
);

doc.end();
      stream.on("finish", () => {
        console.log("✅ PDF Created:", filePath);
        resolve(filePath);
      });

      stream.on("error", (err) => {
        console.error("❌ PDF Stream Error:", err);
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateTicketPDF;

