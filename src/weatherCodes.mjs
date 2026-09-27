// Descriptions and icons for the WMO weather codes that Open-Meteo returns.
// Source: https://open-meteo.com/en/docs ("WMO Weather interpretation codes").
// Each entry is [description, day icon, night icon]. The night icon is only
// given where the day icon shows the sun.
const WEATHER_CODES = {
  0: ['Clear sky', '☀️', '🌙'],
  1: ['Mainly clear', '🌤️', '🌙'],
  2: ['Partly cloudy', '⛅', '☁️'],
  3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'],
  48: ['Depositing rime fog', '🌫️'],
  51: ['Light drizzle', '🌦️', '🌧️'],
  53: ['Moderate drizzle', '🌦️', '🌧️'],
  55: ['Dense drizzle', '🌧️'],
  56: ['Light freezing drizzle', '🌧️'],
  57: ['Dense freezing drizzle', '🌧️'],
  61: ['Slight rain', '🌦️', '🌧️'],
  63: ['Moderate rain', '🌧️'],
  65: ['Heavy rain', '🌧️'],
  66: ['Light freezing rain', '🌧️'],
  67: ['Heavy freezing rain', '🌧️'],
  71: ['Slight snowfall', '🌨️'],
  73: ['Moderate snowfall', '🌨️'],
  75: ['Heavy snowfall', '❄️'],
  77: ['Snow grains', '🌨️'],
  80: ['Slight rain showers', '🌦️', '🌧️'],
  81: ['Moderate rain showers', '🌧️'],
  82: ['Violent rain showers', '🌧️'],
  85: ['Slight snow showers', '🌨️'],
  86: ['Heavy snow showers', '❄️'],
  95: ['Thunderstorm', '⛈️'],
  96: ['Thunderstorm with slight hail', '⛈️'],
  97: ['Heavy thunderstorm', '⛈️'],
  99: ['Thunderstorm with heavy hail', '⛈️'],
};

// The codes this table knows, in ascending order.
export const KNOWN_WEATHER_CODES = Object.keys(WEATHER_CODES).map(Number);

// Function to turn an Open-Meteo weather code into a description and an icon.
// isDay is Open-Meteo's is_day value: 1 in daylight, 0 at night.
export function describeWeather(code, isDay = 1) {
  if (!Object.hasOwn(WEATHER_CODES, code)) {
    return { text: 'Unknown conditions', icon: '🌡️' };
  }
  const [text, dayIcon, nightIcon = dayIcon] = WEATHER_CODES[code];
  return { text, icon: isDay ? dayIcon : nightIcon };
}
