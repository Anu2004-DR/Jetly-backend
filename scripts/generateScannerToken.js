require("dotenv").config();
const jwt = require("jsonwebtoken");
 
const SECRET = process.env.SCANNER_JWT_SECRET;
if (!SECRET) throw new Error("SCANNER_JWT_SECRET not set in .env");
 
// Staff token — expires each shift (12h)
const staffToken = jwt.sign(
  { id: "staff_001", role: "STAFF", name: "Gate Agent BLR-T2", stationCode: "BLR" },
  SECRET,
  { expiresIn: "12h" }
);
 
// Device token — long-lived kiosk/handheld
const deviceToken = jwt.sign(
  { deviceId: "kiosk_blr_gate_4", role: "DEVICE", location: "BLR Gate 4" },
  SECRET,
  { expiresIn: "365d" }
);
 
console.log("Staff Token (12h):\n",  staffToken,  "\n");
console.log("Device Token (365d):\n", deviceToken, "\n");