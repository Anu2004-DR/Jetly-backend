function normalizeFlight(flight) {
  const seg = flight.fltseg[0];

  return {
    provider: "BONTON",

    id: flight.id,

    traceId: flight.tId,

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

    baggage: seg.adtbag,
  };
}

module.exports = normalizeFlight;