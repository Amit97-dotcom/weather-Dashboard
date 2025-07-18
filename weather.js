const API_KEY = 'ca122c4c2ac26ad19d11b57049a68c92';

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const currentLocationBtn = document.getElementById('currentLocationBtn');
const currentWeather = document.getElementById('currentWeather');
const cityDate = document.getElementById('cityDate');
const tempEl = document.getElementById('temp');
const windEl = document.getElementById('wind');
const humidityEl = document.getElementById('humidity');
const weatherIcon = document.getElementById('weatherIcon');
const weatherDesc = document.getElementById('weatherDesc');
const forecastTitle = document.getElementById('forecastTitle');
const forecastContainer = document.getElementById('forecast');
const recentCityDropdown = document.getElementById('recentCityDropdown');

function formatDate(dateStr) {
  return new Date(dateStr).toISOString().split('T')[0];
}

async function fetchWeatherByCity(city) {
  if (!city) return alert('Please enter a city name.');

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();

    if (data.cod !== "200") {
      alert('City not found or error fetching data.');
      return;
    }

    const cityName = data.city.name;
    displayCurrentWeather(cityName, data.list[0]);
    displayForecast(data);
    updateRecentCities(cityName);  
  } catch (error) {
    alert('Error fetching weather data.');
  }
}

async function fetchWeatherByCoordinates(lat, lon, label = 'Your Location') {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    const data = await res.json();

    if (data.cod !== "200") {
      alert('Failed to get weather for your current location.');
      return;
    }

    displayCurrentWeather(label, data.list[0]);
    displayForecast(data);
  } catch {
    alert('Location forecast failed.');
  }
}

function displayCurrentWeather(city, data) {
  cityDate.textContent = `${city} (${formatDate(data.dt_txt)})`;
  tempEl.textContent = data.main.temp.toFixed(2);
  windEl.textContent = data.wind.speed.toFixed(2);
  humidityEl.textContent = data.main.humidity;
  weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  weatherIcon.alt = data.weather[0].description;
  weatherDesc.textContent = data.weather[0].description;
  currentWeather.classList.remove('hidden');
}

function displayForecast(data) {
  forecastTitle.classList.remove('hidden');
  forecastContainer.innerHTML = '';

  const daily = {};
  for (const item of data.list) {
    const date = item.dt_txt.split(' ')[0];
    if (!daily[date] && Object.keys(daily).length < 5) {
      daily[date] = item;
    }
  }

  for (const date in daily) {
    const item = daily[date];
    const div = document.createElement('div');
    div.className = 'bg-gray-700 text-white rounded-md p-4 flex flex-row flex-wrap items-center w-full overflow-hidden';
    div.innerHTML = `
      <div class="font-semibold mb-2">${formatDate(date)}</div>
      <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" class="w-10 h-10 mb-2" />
      <div>Temp: ${item.main.temp.toFixed(2)}°C</div>
      <div>Wind: ${item.wind.speed.toFixed(2)} M/S</div>
      <div>Humidity: ${item.main.humidity}%</div>`;
    forecastContainer.appendChild(div);
  }
}



function updateRecentCities(city) {
  let cities = JSON.parse(localStorage.getItem('recentCities')) || [];
  if (!cities.includes(city)) {
    cities.unshift(city);
    if (cities.length > 5) cities.pop(); 
    localStorage.setItem('recentCities', JSON.stringify(cities));
    populateRecentCityDropdown();
  }
}

function populateRecentCityDropdown() {
  const cities = JSON.parse(localStorage.getItem('recentCities')) || [];

  if (cities.length === 0) {
    recentCityDropdown.classList.add('hidden');
    return;
  }

  recentCityDropdown.classList.remove('hidden');
  recentCityDropdown.innerHTML = `<option disabled selected>Select a recent city</option>`;
  cities.forEach(city => {
    const option = document.createElement('option');
    option.value = city;
    option.textContent = city;
    recentCityDropdown.appendChild(option);
  });
}


recentCityDropdown.addEventListener('change', (e) => {
  const selectedCity = e.target.value;
  if (selectedCity) {
    fetchWeatherByCity(selectedCity);
  }
});



searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) {
    fetchWeatherByCity(city);
  }
});

currentLocationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) return alert('Geolocation not supported.');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      fetchWeatherByCoordinates(position.coords.latitude, position.coords.longitude);
    },
    () => alert('Unable to retrieve location.')
  );
});

window.addEventListener('load', () => {
  populateRecentCityDropdown();

  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      fetchWeatherByCoordinates(position.coords.latitude, position.coords.longitude);
    },
    () => console.log('Location access denied on load.')
  );
});
