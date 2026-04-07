const prisma = require("../../config/prisma");

/* ==============================
   SEARCH BUSES SERVICE
============================== */
const searchBuses = async (from, to) => {
  return prisma.bus.findMany({
    where: {
      fromCity: {
        contains: from,
        mode: "insensitive"
      },
      toCity: {
        contains: to,
        mode: "insensitive"
      }
    }
  });
};

module.exports = { searchBuses };