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

      const doc = new PDFDocument({ size: "A4", margin: 0 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ── HEADER ───────────────────────────────────────────────
      doc.rect(0, 0, 595, 80).fill("#1a73e8");

      doc.fillColor("white").fontSize(26).text("JETLYXO", 50, 30);

      doc.fontSize(12).text("E-Ticket / Boarding Pass", 380, 35);

      // ── PNR BAR ───────────────────────────────────────────────
      doc.rect(0, 90, 595, 30).fill("#f1f3f4");

      doc.fillColor("black").fontSize(12).text(`PNR: ${booking.pnr || "N/A"}`, 50, 100);

      doc.fillColor("green").text("● CONFIRMED", 450, 100);

      // ── PASSENGER DETAILS BOX ────────────────────────────────
      doc.rect(50, 140, 230, 120).stroke();

      doc.fontSize(14).fillColor("black").text("Passenger Details", 60, 150);

      doc
        .fontSize(12)
        .text(`Name: ${booking.passengerName || "N/A"}`, 60, 180)
        .text(`Booking ID: ${booking.id}`, 60, 200)
        .text(`Type: ${booking.bookingType}`, 60, 220);

      // ── JOURNEY DETAILS BOX ──────────────────────────────────
      doc.rect(315, 140, 230, 120).stroke();

      doc.fontSize(14).text("Journey Details", 325, 150);

      doc
        .fontSize(12)
        .text(`From: ${booking.fromCity || "Bangalore"}`, 325, 180)
        .text(`To: ${booking.toCity || "Delhi"}`, 325, 200)
        .text(
          `Date: ${
            booking.date
              ? new Date(booking.date).toLocaleDateString()
              : new Date().toLocaleDateString()
          }`,
          325,
          220
        )
        .text(`Time: ${booking.time || "06:30 AM"}`, 325, 240);

      // ── PAYMENT DETAILS BOX ──────────────────────────────────
      doc.rect(50, 280, 495, 80).stroke();

      doc.fontSize(14).text("Payment Details", 60, 290);

      doc
        .fontSize(12)
        .text(`Amount Paid: ₹${booking.totalPrice}`, 60, 320)
        .text("Payment Status: SUCCESS", 60, 340);

      // ── QR CODE SECTION ──────────────────────────────────────
      //
      //  Layout (y=380 onward):
      //
      //  [ Scan to verify ]     [ QR IMAGE 110×110 ]
      //  [ label text     ]     [                  ]
      //
      //  QR sits right-aligned inside the outer border (x=435)
      //  Left side shows a "Verify your ticket" label block.
      //  If QR generation failed, a graceful fallback text is shown instead.

      const QR_SIZE = 110;       // pt — scannable at any standard print resolution
      const QR_X = 435;          // right-aligned with 10pt padding from border (595-20-130-10)
      const QR_Y = 385;          // below payment box with comfortable breathing room

      if (qrBuffer) {
        // QR image — embedded directly from Buffer, no temp file
        doc.image(qrBuffer, QR_X, QR_Y, {
          width: QR_SIZE,
          height: QR_SIZE,
          fit: [QR_SIZE, QR_SIZE],
          align: "center",
          valign: "center",
        });

        // Label below QR
        doc
          .fontSize(8)
          .fillColor("gray")
          .text("Scan to verify ticket", QR_X, QR_Y + QR_SIZE + 4, {
            width: QR_SIZE,
            align: "center",
          });

        // Left-side label block aligned vertically with the QR
        doc
          .fontSize(11)
          .fillColor("black")
          .text("Ticket QR Code", 60, QR_Y + 10);

        doc
          .fontSize(9)
          .fillColor("gray")
          .text(
            "Present this QR at the gate\nfor quick verification.",
            60,
            QR_Y + 28,
            { width: 200 }
          );
      } else {
        // ── GRACEFUL FALLBACK: QR failed — show booking ID prominently
        doc
          .fontSize(11)
          .fillColor("black")
          .text("Verification Code", 60, QR_Y + 10);

        doc
          .fontSize(9)
          .fillColor("gray")
          .text(
            `Booking ID: ${booking.id}\nPresent this ID at the counter for verification.`,
            60,
            QR_Y + 28,
            { width: 360 }
          );
      }

      // ── FOOTER NOTE ──────────────────────────────────────────
      doc
        .fontSize(10)
        .fillColor("gray")
        .text(
          "Please carry a valid ID proof. Arrive at least 30 minutes before departure.",
          50,
          510, // shifted down slightly from your original 400 to accommodate QR
          { width: 495, align: "center" }
        );

      // ── OUTER BORDER ─────────────────────────────────────────
      doc.rect(20, 20, 555, 802).stroke();

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