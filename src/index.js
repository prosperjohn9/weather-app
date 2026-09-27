import { describeWeather } from './weatherCodes.mjs';

// Open-Meteo (weather and place search) and OpenStreetMap's Nominatim (place
// names for coordinates) are free and need no API key or sign-up, so the app
// works as soon as it is served.
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
// Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/
const REVERSE_GEOCODING_URL = 'https://nominatim.openstreetmap.org/reverse';

// Place names already looked up during this visit, keyed by "lat,lon". The
// Nominatim policy asks apps to cache results and not repeat the same query.
const placeNameCache = new Map();

// Add an event listener to the form for handling the submission event.
document
  .getElementById('weatherForm')
  .addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission behavior.
    const location = document.getElementById('locationInput').value.trim(); // Get the value from the location input field.
    if (!location) {
      return; // Ignore a search that is only spaces.
    }
    displayLoading(true); // Show the loading indicator.
    fetchWeatherData(location); // Fetch weather data for the entered location.
  });

// Add an event listener to the "Use Current Location" button.
document.getElementById('useLocation').addEventListener('click', function () {
  if (navigator.geolocation) {
    displayLoading(true); // Show the loading indicator.
    navigator.geolocation.getCurrentPosition(
      function (position) {
        // Success callback: Extract latitude and longitude from the position object.
        // Round to 3 decimals (about 110 m): enough for the weather and the
        // town name, without sending the exact position to third parties.
        const lat = Math.round(position.coords.latitude * 1000) / 1000;
        const lon = Math.round(position.coords.longitude * 1000) / 1000;
        fetchWeatherDataByCoords(lat, lon); // Fetch weather data using the coordinates.
      },
      function (error) {
        // Error callback: Handle location errors (e.g., user denied location access).
        displayLoading(false); // Hide the loading indicator.
        alert('Error obtaining location: ' + error.message); // Show an alert with the error message.
      },
      { timeout: 15000 } // Give up if the device takes over 15 seconds to find its position.
    );
  } else {
    alert('Geolocation is not supported by your browser.'); // Show an alert if geolocation is not supported.
  }
});

// Global variables to store the current weather data and the temperature unit.
let currentWeatherData = null;
let isCelsius = true;

// Add an event listener to the temperature toggle button.
document.getElementById('toggleTemp').addEventListener('click', function () {
  isCelsius = !isCelsius; // Toggle the temperature unit between Celsius and Fahrenheit.
  if (currentWeatherData) {
    displayWeatherData(currentWeatherData); // Update the display with the new temperature unit.
  }
});

// Function to fetch weather data using latitude and longitude coordinates.
async function fetchWeatherDataByCoords(lat, lon) {
  try {
    // Fetch the forecast and the place name at the same time.
    const [forecast, place] = await Promise.all([
      fetchForecast(lat, lon),
      fetchPlaceName(lat, lon),
    ]);
    showWeather(place, forecast);
  } catch (error) {
    showError('Failed to load weather data. Please try again.', error);
  } finally {
    displayLoading(false); // Hide the loading indicator after fetching the data.
  }
}

// Function to control the display of the loading indicator.
function displayLoading(show) {
  document.getElementById('loading').style.display = show ? 'block' : 'none';
  // Disable the search and location buttons while a request is running, so a
  // second click cannot start overlapping requests.
  document.querySelector('#weatherForm button[type="submit"]').disabled = show;
  document.getElementById('useLocation').disabled = show;
}

// Function to fetch weather data for a specific location.
async function fetchWeatherData(location) {
  try {
    let place = await findPlace(location);
    if (!place && location.includes(',')) {
      // Open-Meteo only understands an exact country name or code after a
      // comma ("London, GB"), so retry "London, UK" as just "London".
      place = await findPlace(location.split(',')[0].trim());
    }
    if (!place) {
      showError(
        `No place found for "${location}". Check the spelling and try again.`
      );
      return;
    }
    const forecast = await fetchForecast(place.latitude, place.longitude);
    showWeather(place, forecast);
  } catch (error) {
    showError('Failed to load weather data. Please try again.', error);
  } finally {
    displayLoading(false); // Hide the loading indicator after fetching the data.
  }
}

// Function to fetch JSON from a URL, treating HTTP errors as failures.
async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.json();
}

// Function to look up a place by name with Open-Meteo's geocoding API.
// Returns null when nothing matches.
async function findPlace(name) {
  const params = new URLSearchParams({
    name,
    count: 1,
    language: 'en',
    format: 'json',
  });
  const data = await fetchJson(`${GEOCODING_URL}?${params}`);
  if (!data.results || data.results.length === 0) {
    return null;
  }
  const result = data.results[0];
  return {
    name: result.name,
    region: result.admin1,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

// Function to find the place name for coordinates with Nominatim. If that
// fails, fall back to the coordinates so the weather still loads.
async function fetchPlaceName(lat, lon) {
  const cacheKey = `${lat},${lon}`;
  if (placeNameCache.has(cacheKey)) {
    return placeNameCache.get(cacheKey);
  }
  const fallback = {
    name: `Your location (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
  };
  try {
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat,
      lon,
      zoom: 12, // Town level: returns "Agbor" rather than its local government area.
      'accept-language': 'en',
    });
    // Stop waiting after 5 seconds, so a slow Nominatim cannot hold back the
    // forecast; the catch below then falls back to the coordinates.
    const data = await fetchJson(`${REVERSE_GEOCODING_URL}?${params}`, {
      signal: AbortSignal.timeout(5000),
    });
    const address = data.address;
    if (!address) {
      return fallback; // Nominatim answers {"error": ...} for places like open sea.
    }
    const place = {
      name:
        address.city ||
        address.town ||
        address.village ||
        address.suburb ||
        address.county ||
        data.name ||
        fallback.name,
      region: address.state,
      country: address.country,
    };
    placeNameCache.set(cacheKey, place);
    return place;
  } catch (error) {
    console.error('Failed to fetch place name:', error);
    return fallback;
  }
}

// Function to fetch today's weather for coordinates from Open-Meteo.
async function fetchForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current:
      'temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m',
    daily:
      'temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,daylight_duration',
    timezone: 'auto', // Report times in the place's own time zone.
    forecast_days: 1,
  });
  return fetchJson(`${FORECAST_URL}?${params}`);
}

// Function to store the latest result and show it.
function showWeather(place, forecast) {
  currentWeatherData = { place, forecast, fetchedAt: Date.now() };
  displayWeatherData(currentWeatherData);
}

// Function to show a message in place of the weather.
function showError(message, error) {
  if (error) {
    console.error('Failed to fetch weather data:', error);
  }
  currentWeatherData = null; // Stop the unit toggle from bringing back old data.
  document.getElementById('weatherDisplay').textContent = message;
}

// Function to display weather data in the web page. Every value is set with
// textContent, so text from the APIs is never parsed as HTML.
function displayWeatherData(data) {
  const { place, forecast, fetchedAt } = data;
  const { current, daily } = forecast;
  const condition = describeWeather(current.weather_code, current.is_day);
  const weatherDisplay = document.getElementById('weatherDisplay');
  weatherDisplay.replaceChildren(); // Clear the previous result.

  addDetail(weatherDisplay, 'Location', place.name);
  addDetail(weatherDisplay, 'Region', place.region);
  addDetail(weatherDisplay, 'Country', place.country);
  addDetail(
    weatherDisplay,
    'Date/Time',
    formatLocalTime(fetchedAt, forecast.utc_offset_seconds)
  );
  addDetail(weatherDisplay, 'Temperature', formatTemp(current.temperature_2m));
  addDetail(weatherDisplay, 'Condition', condition.text);
  addIcon(weatherDisplay, condition);
  addDetail(weatherDisplay, 'Wind Speed', withUnit(current.wind_speed_10m, ' km/h'));
  addDetail(weatherDisplay, 'Humidity', withUnit(current.relative_humidity_2m, '%'));
  addDetail(weatherDisplay, 'Max Temp', formatTemp(daily.temperature_2m_max[0]));
  addDetail(weatherDisplay, 'Min Temp', formatTemp(daily.temperature_2m_min[0]));
  addDetail(
    weatherDisplay,
    'Chance of Rain',
    withUnit(daily.precipitation_probability_max[0], '%')
  );
  const daylight = daily.daylight_duration[0];
  addDetail(weatherDisplay, 'Sunrise', formatSunTime(daily.sunrise[0], daylight));
  addDetail(weatherDisplay, 'Sunset', formatSunTime(daily.sunset[0], daylight));
}

// Function to add one "Label: value" row to the weather display.
function addDetail(container, label, value) {
  const row = document.createElement('div');
  row.className = 'weatherDetail';
  const labelElement = document.createElement('strong');
  labelElement.textContent = `${label}:`;
  row.append(labelElement, ` ${isMissing(value) ? 'N/A' : value}`);
  container.append(row);
}

// Function to add the weather icon row to the weather display.
function addIcon(container, condition) {
  const row = document.createElement('div');
  row.className = 'weatherDetail';
  const icon = document.createElement('span');
  icon.className = 'weatherIcon';
  icon.setAttribute('role', 'img');
  icon.setAttribute('aria-label', condition.text);
  icon.textContent = condition.icon;
  row.append(icon);
  container.append(row);
}

// Function to check for a value the API did not send.
function isMissing(value) {
  return value === null || value === undefined || value === '';
}

// Function to add a unit to a value, or return null when the value is missing.
function withUnit(value, unit) {
  return isMissing(value) ? null : `${value}${unit}`;
}

// Function to show a Celsius value in the chosen unit, e.g. 27.1 -> "80.8 °F".
function formatTemp(celsius) {
  if (isMissing(celsius)) {
    return null;
  }
  if (isCelsius) {
    return `${celsius} °C`;
  }
  const fahrenheit = Math.round(((celsius * 9) / 5 + 32) * 10) / 10;
  return `${fahrenheit} °F`;
}

// Function to show the place's local time when the weather was fetched, e.g.
// "2026-09-27 14:44". Open-Meteo's current.time is the start of its 15-minute
// data slot, so it can be up to 14 minutes behind the clock.
function formatLocalTime(timestamp, utcOffsetSeconds) {
  if (isMissing(utcOffsetSeconds)) {
    return null;
  }
  const localTime = new Date(timestamp + utcOffsetSeconds * 1000);
  return localTime.toISOString().slice(0, 16).replace('T', ' ');
}

// Function to show a sunrise or sunset time, allowing for days when the sun
// never rises (polar night) or never sets (midnight sun).
function formatSunTime(isoTime, daylightSeconds) {
  if (daylightSeconds === 0) {
    return 'None today (polar night)';
  }
  if (daylightSeconds >= 86400) {
    return 'None today (midnight sun)';
  }
  return formatClock(isoTime);
}

// Function to turn Open-Meteo's local time "2026-09-27T06:23" into "06:23 AM".
function formatClock(isoTime) {
  if (isMissing(isoTime)) {
    return null;
  }
  const [hours, minutes] = isoTime.split('T')[1].split(':').map(Number);
  const period = hours < 12 ? 'AM' : 'PM';
  const hours12 = hours % 12 || 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}
