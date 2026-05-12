const { z } = require("zod");

const flightSearchSchema = z.object({
  origin: z.string().min(3).max(3),
  destination: z.string().min(3).max(3),
  departureDate: z.string(),
  adults: z.coerce.number().min(1).max(9),
});

module.exports = {
  flightSearchSchema,
};