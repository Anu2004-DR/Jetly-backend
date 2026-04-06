const prisma = require("../../config/prisma");

const searchTrainsService = async (from, to) => {
  return prisma.train.findMany({
    where: {
      from: { contains: from, mode: "insensitive" },
      to: { contains: to, mode: "insensitive" }
    }
  });
};

module.exports = { searchTrainsService };