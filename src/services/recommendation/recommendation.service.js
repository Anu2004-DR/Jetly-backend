function getRecommendations(userBookings, allData) {
  if (!userBookings.length) return allData.slice(0, 5);

  const validBookings = userBookings.filter(
    (b) => b.price && b.source && b.destination
  );

  if (!validBookings.length) return allData.slice(0, 5);

  const avgPrice =
    validBookings.reduce((sum, b) => sum + Number(b.price), 0) /
    validBookings.length;

  const preferredRoutes = validBookings.map((b) => ({
    source: b.source.toLowerCase(),
    destination: b.destination.toLowerCase(),
  }));

  const scored = allData.map((item) => {
    let score = 0;

    const itemSource = item.source?.toLowerCase();
    const itemDestination = item.destination?.toLowerCase();

    
    if (
      preferredRoutes.some(
        (r) =>
          r.source === itemSource &&
          r.destination === itemDestination
      )
    ) {
      score += 5;
    }

    const priceDiff = Math.abs(item.price - avgPrice);

    if (priceDiff < 500) score += 5;
    else if (priceDiff < 1000) score += 3;
    else if (priceDiff < 2000) score += 1;

    if (item.price < avgPrice) score += 1;

    return {
      ...item,
      score,
      reason:
        priceDiff < 500
          ? "Very close to your usual price"
          : priceDiff < 1000
          ? "Similar to your budget"
          : "Within your price range",
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

module.exports = {
  getRecommendations
};