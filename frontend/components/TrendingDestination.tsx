export default function TrendingDestinations() {
  const places = ["Dubai", "Bali", "Paris", "Singapore"];

  return (
    <section className="py-16 text-center text-white">
      <h2 className="text-3xl font-bold mb-6">Trending Destinations 🌍</h2>
      <div className="flex justify-center gap-6">
        {places.map((place, i) => (
          <div key={i} className="bg-slate-800 p-4 rounded">
            {place}
          </div>
        ))}
      </div>
    </section>
  );
}