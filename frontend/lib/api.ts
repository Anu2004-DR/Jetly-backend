const API_URL = "http://localhost:5000/api";

export async function searchFlights(from: string, to: string) {
  const res = await fetch(`${API_URL}/flights?from=${from}&to=${to}`);
  return res.json();
}