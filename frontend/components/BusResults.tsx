"use client";

import { buses } from "@/lib/mockBuses";

export default function BusResults() {
  return (
    <div className="mt-6 space-y-4">
      {buses.map((bus, index) => (
        <div
          key={index}
          className="bg-slate-800 p-4 rounded flex justify-between text-white"
        >
          <div>
            <h3 className="font-bold">{bus.operator}</h3>
            <p>{bus.from} → {bus.to}</p>
          </div>

          <div>
            <p>{bus.duration}</p>
          </div>

          <div className="text-blue-400 font-bold">
            ₹{bus.price}
          </div>
        </div>
      ))}
    </div>
  );
}