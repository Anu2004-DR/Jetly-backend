const prisma = require("../../config/prisma");

/* ==============================
   SEARCH TRAINS SERVICE
============================== */
const searchTrains = async (from, to) => {
  return prisma.train.findMany({
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

module.exports = { searchTrains };