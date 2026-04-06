function normalizeFlight(flight) {
  return {
    id: flight.id,
    type: "flight",
    source: flight.fromCity,
    destination: flight.toCity,
    price: flight.price,
    departureTime: flight.dep,
    raw: flight
  };
}

function normalizeBus(bus) {
  return {
    id: bus.id,
    type: "bus",
    source: bus.fromCity,
    destination: bus.toCity,
    price: bus.price,
    departureTime: bus.departure,
    raw: bus
  };
}

function normalizeTrain(train) {
  return {
    id: train.id,
    type: "train",
    source: train.fromCity,
    destination: train.toCity,
    price: train.price,
    departureTime: train.departure,
    raw: train
  };
}

module.exports = {
  normalizeFlight,
  normalizeBus,
  normalizeTrain
};