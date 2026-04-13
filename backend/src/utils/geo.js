const EARTH_RADIUS_KM = 6371;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function calculateDistanceKm(fromLat, fromLng, toLat, toLng) {
  const latDistance = toRadians(toLat - fromLat);
  const lngDistance = toRadians(toLng - fromLng);

  const a =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(lngDistance / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

module.exports = {
  calculateDistanceKm,
};
