const prisma = require("../../config/prisma");
const busRoutes = require("./modules/bus/bus.routes");
app.use("/api/buses", busRoutes);

const searchBusesService = async (from, to) => {
  return prisma.bus.findMany({
    where: {
      from: { contains: from, mode: "insensitive" },
      to: { contains: to, mode: "insensitive" }
    }
  });
};

module.exports = { searchBusesService };
