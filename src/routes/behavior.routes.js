const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");


router.post("/track", async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { action, metadata } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: "Action is required",
      });
    }

    const event = await prisma.userBehavior.create({
      data: {
        userId,
        action,
        metadata,
      },
    });

    return res.json({
      success: true,
      data: event,
    });

  } catch (err) {
    console.error("BEHAVIOR ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to track behavior",
    });
  }
});

module.exports = router;