// Add an event listener to the form for handling the submission event.
document
  .getElementById('weatherForm')
  .addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission behavior.
    const location = document.getElementById('locationInput').value; // Get the value from the location input field.
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
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeatherDataByCoords(lat, lon); // Fetch weather data using the coordinates.
      },
      function (error) {
        // Error callback: Handle location errors (e.g., user denied location access).
        displayLoading(false); // Hide the loading indicator.
        alert('Error obtaining location: ' + error.message); // Show an alert with the error message.
      }
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
  const apiKey = '9fc12ff726af487cb89114223240904';
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=1&aqi=no&alerts=no`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    currentWeatherData = await response.json();
    displayWeatherData(currentWeatherData);
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    document.getElementById('weatherDisplay').innerHTML =
      'Failed to load weather data. Please try again.';
  } finally {
    displayLoading(false); // Hide the loading indicator after fetching the data.
  }
}

// Function to control the display of the loading indicator.
function displayLoading(show) {
  document.getElementById('loading').style.display = show ? 'block' : 'none';
}

// Function to fetch weather data for a specific location.
async function fetchWeatherData(location) {
  const apiKey = '9fc12ff726af487cb89114223240904';
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${location}&days=1&aqi=no&alerts=no`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    currentWeatherData = await response.json(); // Store fetched data globally
    displayWeatherData(currentWeatherData);
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    document.getElementById('weatherDisplay').innerHTML =
      'Failed to load weather data. Please try again.';
  }
}

// Function to display weather data in the web page.
function displayWeatherData(data) {
  displayLoading(false); // Ensure the loading indicator is hidden.
  const tempUnit = isCelsius ? '°C' : '°F'; // Determine the temperature unit.
  const currentTemp = isCelsius ? data.current.temp_c : data.current.temp_f; // Convert temperature based on the unit.
  const maxTemp = isCelsius
    ? data.forecast.forecastday[0].day.maxtemp_c
    : data.forecast.forecastday[0].day.maxtemp_f;
  const minTemp = isCelsius
    ? data.forecast.forecastday[0].day.mintemp_c
    : data.forecast.forecastday[0].day.mintemp_f;
  // Construct the HTML to display all weather details.
  const weatherDisplay = document.getElementById('weatherDisplay');
  weatherDisplay.innerHTML = `
        <div class="weatherDetail"><strong>Location:</strong> ${data.location.name}</div>
        <div class="weatherDetail"><strong>Region:</strong> ${data.location.region}</div>
        <div class="weatherDetail"><strong>Country:</strong> ${data.location.country}</div>
        <div class="weatherDetail"><strong>Date/Time:</strong> ${data.location.localtime}</div>
        <div class="weatherDetail"><strong>Temperature:</strong> ${currentTemp} ${tempUnit}</div>
        <div class="weatherDetail"><strong>Condition:</strong> ${data.current.condition.text}</div>
        <div class="weatherDetail"><img src="https:${data.current.condition.icon}" alt="Weather Icon"></div>
        <div class="weatherDetail"><strong>Wind Speed:</strong> ${data.current.wind_kph} kph</div>
        <div class="weatherDetail"><strong>Humidity:</strong> ${data.current.humidity}%</div>
        <div class="weatherDetail"><strong>Max Temp:</strong> ${maxTemp} ${tempUnit}</div>
        <div class="weatherDetail"><strong>Min Temp:</strong> ${minTemp} ${tempUnit}</div>
        <div class="weatherDetail"><strong>Chance of Rain:</strong> ${data.forecast.forecastday[0].day.daily_chance_of_rain}%</div>
        <div class="weatherDetail"><strong>Sunrise:</strong> ${data.forecast.forecastday[0].astro.sunrise}</div>
        <div class="weatherDetail"><strong>Sunset:</strong> ${data.forecast.forecastday[0].astro.sunset}</div>
    `;
}
