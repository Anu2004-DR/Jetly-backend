const prisma = require("../../config/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


const otpGenerator = require("otp-generator");
const otpStore = require("../../utils/otpStores");
const { sendOTPEmail } = require("../../utils/email");

exports.signup = async (req, res) => {

  try {

    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: user.id
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};



exports.loginOrSignup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required"
      });
    }

    let user = await prisma.user.findUnique({
      where: { email }
    });

    // 🆕 CASE 1: New user
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);

      user = await prisma.user.create({
        data: {
          email,
          name: name || "New User",
          password: hashedPassword,
          provider: "local"
        }
      });
    }

    // 🔄 CASE 2: Existing OTP user → upgrade to password
    else if (!user.password) {
      const hashedPassword = await bcrypt.hash(password, 10);

      user = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          provider: "local"
        }
      });
    }

    // 🔐 CASE 3: Normal login
    else {
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({
          message: "Invalid password"
        });
      }
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      userId: user.id
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};






exports.sendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  // ✅ numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(email, {
    otp,
    expires: Date.now() + 5 * 60 * 1000,
  });

  console.log("OTP for", email, ":", otp);

  try {
    await sendOTPEmail(email, otp);
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("❌ Email error:", error.message);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  const record = otpStore.get(email);

  if (!record) {
    return res.status(400).json({ message: "OTP not found" });
  }

  if (Date.now() > record.expires) {
    return res.status(400).json({ message: "OTP expired" });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  otpStore.delete(email);

  // 🔥 ALWAYS FIND FIRST (NO DUPLICATES)
  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: "New User",
        provider: "otp"
      }
    });
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    message: "Login successful",
    token,
    userId: user.id
  });
};