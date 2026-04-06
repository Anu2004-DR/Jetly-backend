const prisma = require("../../config/prisma");

const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      status: "success",
      bookings,
    });
  } catch (err) {
    next(err);
  }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json({
      status: "success",
      booking: updated,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllBookings,
  updateBookingStatus,
};