/**
 * Utility functions for geolocation, Haversine distance, and directions.
 */

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates the great-circle distance between two geographical points using the Haversine formula.
 * @param {number|string} lat1 Latitude of point 1
 * @param {number|string} lon1 Longitude of point 1
 * @param {number|string} lat2 Latitude of point 2
 * @param {number|string} lon2 Longitude of point 2
 * @returns {number|null} Distance in kilometers rounded to 1 decimal place, or null if coordinates invalid.
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }
  if (typeof lat1 === "string" && lat1.trim() === "") return null;
  if (typeof lon1 === "string" && lon1.trim() === "") return null;
  if (typeof lat2 === "string" && lat2.trim() === "") return null;
  if (typeof lon2 === "string" && lon2.trim() === "") return null;

  const p1 = Number(lat1);
  const l1 = Number(lon1);
  const p2 = Number(lat2);
  const l2 = Number(lon2);

  if (isNaN(p1) || isNaN(l1) || isNaN(p2) || isNaN(l2)) {
    return null;
  }

  const dLat = toRadians(p2 - p1);
  const dLon = toRadians(l2 - l1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(p1)) *
      Math.cos(toRadians(p2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 10) / 10;
}

/**
 * Formats a distance in kilometers into a customer-friendly Vietnamese string.
 * @param {number|null} distanceKm
 * @returns {string} e.g. "Cách bạn 2.4 km"
 */
export function formatDistanceKm(distanceKm) {
  if (distanceKm == null || isNaN(distanceKm)) return "";
  return `Cách bạn ${distanceKm} km`;
}

/**
 * Builds a Google Maps turn-by-turn directions URL.
 * @param {number|string} latitude
 * @param {number|string} longitude
 * @returns {string}
 */
export function getGoogleMapsDirectionsUrl(latitude, longitude) {
  if (latitude == null || longitude == null || isNaN(Number(latitude)) || isNaN(Number(longitude))) {
    return "https://www.google.com/maps";
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

/**
 * Finds the closest branch from user coordinates.
 * @param {{ latitude: number, longitude: number }} userCoords
 * @param {Array} branches
 * @returns {{ branch: Object, distanceKm: number }|null}
 */
export function findClosestBranch(userCoords, branches = []) {
  if (!userCoords || !branches?.length) return null;

  let closest = null;
  let minDistance = Infinity;

  branches.forEach((branch) => {
    if (branch.latitude && branch.longitude) {
      const dist = calculateHaversineDistanceKm(
        userCoords.latitude,
        userCoords.longitude,
        branch.latitude,
        branch.longitude
      );
      if (dist !== null && dist < minDistance) {
        minDistance = dist;
        closest = { branch, distanceKm: dist };
      }
    }
  });

  return closest;
}
