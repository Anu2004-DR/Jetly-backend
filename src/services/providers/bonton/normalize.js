function normalizeFlight(flight, searchId) {
  const seg = flight.fltseg?.[0];

  if (!seg) return null;

  return {
    provider: "BONTON",

    id: flight.id,

    // Required for future APIs
    searchId,
    traceId: flight.traid,
    tId: flight.tId,

    airline: seg.airna,
    flightNumber: seg.fltno,

    from: seg.orgapco,
    to: seg.desapco,

    departure: seg.deptm,
    arrival: seg.arrtm,

    duration: flight.tottrv,

    stops: flight.stp,

    price: flight.salpr,

    currency: flight.cur,

    refundable: flight.isrf,

    seats: seg.seatavl,

    cabin: flight.cabcls,

    baggage: {
      cabin: seg.adtcbag,
      checkin: seg.adtbag,
    },

    airlineRemarks: flight.airrem,
  };
}

function normalizeFlights(response) {
  if (!response?.success || !response?.data?.flt) {
    return [];
  }

  const searchId = response.data.sId;

  return response.data.flt
    .map((flight) => normalizeFlight(flight, searchId))
    .filter(Boolean);
}

module.exports = normalizeFlights;