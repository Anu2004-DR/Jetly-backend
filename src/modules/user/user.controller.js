const prisma = require("../../config/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const otpStore = require("../../utils/otpStores");
const { sendOTPEmail } = require("../../utils/email");

/* =========================
   LOGIN / SIGNUP
========================= */
exports.loginOrSignup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);

      user = await prisma.user.create({
        data: {
          email,
          name: name || "New User",
          password: hashedPassword,
          provider: "local",
        },
      });
    } else if (!user.password) {
      const hashedPassword = await bcrypt.hash(password, 10);

      user = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          provider: "local",
        },
      });
    } else {
      const validPassword = await bcrypt.compare(
        password,
        user.password
      );

      if (!validPassword) {
        return res.status(401).json({
          message: "Invalid password",
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
      userId: user.id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

/* =========================
   SEND OTP
========================= */
exports.sendOTP = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({
        message: "Email or mobile required",
      });
    }

    const isEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    const isPhone =
      /^[6-9]\d{9}$/.test(identifier);

    if (!isEmail && !isPhone) {
      return res.status(400).json({
        message: "Invalid email or mobile",
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    otpStore.set(identifier, {
      otp,
      expires: Date.now() + 5 * 60 * 1000,
    });

    console.log("OTP:", otp);

    if (isEmail) {
      await sendOTPEmail(identifier, otp);
    } else {
      console.log(
        `SMS OTP for ${identifier}: ${otp}`
      );

      // TODO:
      // Integrate MSG91 / Twilio here
    }

    res.json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to send OTP",
    });
  }
};

/* =========================
   VERIFY OTP
========================= */
exports.verifyOTP = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    const record = otpStore.get(identifier);

    if (!record) {
      return res.status(400).json({
        message: "OTP not found",
      });
    }

    if (Date.now() > record.expires) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    if (record.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    otpStore.delete(identifier);

    const isEmail = identifier.includes("@");

    let user;

    if (isEmail) {
      user = await prisma.user.findUnique({
        where: {
          email: identifier,
        },
      });
    } else {
      user = await prisma.user.findUnique({
        where: {
          phone: identifier,
        },
      });
    }

    if (!user) {
      if (isEmail) {
        user = await prisma.user.create({
          data: {
            email: identifier,
            name: "New User",
            provider: "otp",
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            phone: identifier,
            name: "New User",
            provider: "otp",
          },
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
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Verification failed",
      error: error.message,
    });
  }
};

/* =========================
   CURRENT USER
========================= */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        provider: true,
      },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user",
    });
  }
};