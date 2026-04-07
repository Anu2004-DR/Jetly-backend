const prisma = require("../../config/prisma");

exports.trackBehavior = async (req, res) => {
  try {
    const { type, source, destination, price } = req.body;

    await prisma.userBehavior.create({
      data: {
        userId: req.userId,
        type,
        source,
        destination,
        price
      }
    });

    res.json({ success: true });

  } catch (err) {
    console.error("TRACK ERROR:", err);
    res.status(500).json({ message: "Tracking failed" });
  }
};