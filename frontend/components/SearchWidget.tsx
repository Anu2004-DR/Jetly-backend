"use client";

import { useState } from "react";
import { flights } from "@/lib/mockFlights";

export default function SearchWidget() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = () => {
    const filtered = flights.filter(
      (f) =>
        f.from.toLowerCase().includes(from.toLowerCase()) &&
        f.to.toLowerCase().includes(to.toLowerCase())
    );

    setResults(filtered);
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg text-white">
      <h3 className="text-xl font-bold mb-4 text-center">Search Flights ✈️</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* From */}
        <input
          placeholder="From"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="p-2 rounded text-black"
        />

        {/* To */}
        <input
          placeholder="To"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="p-2 rounded text-black"
        />

        {/* Date */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="p-2 rounded text-black"
        />
      </div>

      <div className="text-center mt-4">
        <button
          onClick={handleSearch}
          className="bg-blue-500 px-6 py-2 rounded"
        >
          Search Flights
        </button>
      </div>

      {/* Results */}
      <div className="mt-6 space-y-3">
        {results.map((flight, index) => (
          <div
            key={index}
            className="bg-slate-700 p-4 rounded flex justify-between"
          >
            <div>
              <p className="font-bold">{flight.airline}</p>
              <p>{flight.from} → {flight.to}</p>
            </div>

            <div>
              <p>{flight.duration}</p>
              <p>{flight.departure}</p>
            </div>

            <div className="text-blue-400 font-bold">
              ₹{flight.price}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}