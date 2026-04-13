function getRecommendations(userBookings, allData) {

  if (!userBookings.length) return allData.slice(0, 5);

  const validBookings = userBookings.filter(
    (b) => b.price && (b.source || b.from) && (b.destination || b.to)
  );

  if (!validBookings.length) return allData.slice(0, 5);

  // 🔥 Normalize user data
  const userRoutes = validBookings.map(b => ({
    source: (b.source || b.from).toLowerCase(),
    destination: (b.destination || b.to).toLowerCase(),
    price: Number(b.price)
  }));

  const avgPrice =
    userRoutes.reduce((sum, b) => sum + b.price, 0) /
    userRoutes.length;

  const scored = allData.map(item => {
    let score = 0;

    const itemSource = item.source?.toLowerCase();
    const itemDestination = item.destination?.toLowerCase();

    for (let route of userRoutes) {

      // ✅ Same route
      if (route.source === itemSource && route.destination === itemDestination) {
        score += 6;
      }

      // ✅ Same source
      if (route.source === itemSource) {
        score += 3;
      }

      // ✅ Same destination
      if (route.destination === itemDestination) {
        score += 2;
      }

      // ✅ Price similarity
      const priceDiff = Math.abs(item.price - avgPrice);

      if (priceDiff < 500) score += 4;
      else if (priceDiff < 1000) score += 2;
      else if (priceDiff < 2000) score += 1;

      // ✅ Cheaper bonus
      if (item.price < avgPrice) score += 2;
    }

    return {
      ...item,
      score,
      reason:
        item.price < avgPrice
          ? "Cheaper than your usual bookings"
          : "Matches your travel pattern"
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

module.exports = { getRecommendations };