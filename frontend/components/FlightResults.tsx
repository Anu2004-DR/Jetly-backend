import { flights } from "@/lib/mockFlights";

export default function FlightResults() {
  return (
    <div className="space-y-4">
      {flights.map((flight, index) => (
        <div
          key={index}
          className="p-4 bg-slate-800 rounded-lg text-white flex justify-between"
        >
          <div>
            <h3 className="font-bold">{flight.airline}</h3>
            <p>{flight.from} → {flight.to}</p>
          </div>

          <div>
            <p>{flight.departure}</p>
            <p>{flight.duration}</p>
          </div>

          <div className="font-bold text-blue-400">
            ₹{flight.price}
          </div>
        </div>
      ))}
    </div>
  );
}