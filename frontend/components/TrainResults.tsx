"use client";

import { trains } from "@/lib/mockTrains";

export default function TrainResults() {
  return (
    <div className="mt-6 space-y-4">
      {trains.map((train, index) => (
        <div
          key={index}
          className="bg-slate-800 p-4 rounded flex justify-between text-white"
        >
          <div>
            <h3 className="font-bold">{train.name}</h3>
            <p>{train.from} → {train.to}</p>
          </div>

          <div>
            <p>{train.duration}</p>
          </div>

          <div className="text-blue-400 font-bold">
            ₹{train.price}
          </div>
        </div>
      ))}
    </div>
  );
}