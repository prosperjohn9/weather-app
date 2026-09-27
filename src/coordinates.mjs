// Matches "latitude, longitude" or "latitude longitude", e.g. "6.25, 6.19".
const COORDINATES_PATTERN =
  /^\s*([+-]?\d+(?:\.\d+)?)\s*(?:,\s*|\s+)([+-]?\d+(?:\.\d+)?)\s*$/;

// Function to read a search such as "6.25, 6.19" as coordinates. Returns
// { lat, lon }, or null when the text is not a valid latitude and longitude,
// so it can be searched as a place name instead.
export function parseCoordinates(text) {
  const match = COORDINATES_PATTERN.exec(text);
  if (!match) {
    return null;
  }
  const lat = Number(match[1]);
  const lon = Number(match[2]);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return null;
  }
  return { lat, lon };
}

// Function to round a coordinate to 3 decimals (about 110 m): enough for the
// weather and the town name, without sending an exact position to third
// parties.
export function roundCoordinate(value) {
  return Math.round(value * 1000) / 1000;
}
