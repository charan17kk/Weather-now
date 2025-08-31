import React, { useState, useEffect, useRef } from "react";

const weatherCodeToInfo = {
  0: { icon: "☀️", label: "Clear sky" },
  1: { icon: "🌤️", label: "Mainly clear" },
  2: { icon: "⛅", label: "Partly cloudy" },
  3: { icon: "☁️", label: "Overcast" },
  45: { icon: "🌫️", label: "Foggy" },
  48: { icon: "❄️", label: "Freezing fog" },
  51: { icon: "🌧️", label: "Light drizzle" },
  53: { icon: "🌧️", label: "Moderate drizzle" },
  55: { icon: "🌧️", label: "Heavy drizzle" },
  56: { icon: "🌧️", label: "Light freezing drizzle" },
  57: { icon: "🌧️", label: "Dense freezing drizzle" },
  61: { icon: "🌧️", label: "Light rain" },
  63: { icon: "🌧️", label: "Moderate rain" },
  65: { icon: "🌧️", label: "Heavy rain" },
  66: { icon: "🌧️", label: "Light freezing rain" },
  67: { icon: "🌧️", label: "Heavy freezing rain" },
  71: { icon: "🌨️", label: "Light snow" },
  73: { icon: "🌨️", label: "Moderate snow" },
  75: { icon: "🌨️", label: "Heavy snow" },
  77: { icon: "❄️", label: "Snow grains" },
  80: { icon: "🌦️", label: "Light showers" },
  81: { icon: "🌦️", label: "Moderate showers" },
  82: { icon: "🌦️", label: "Heavy showers" },
  85: { icon: "🌨️", label: "Light snow showers" },
  86: { icon: "🌨️", label: "Heavy snow showers" },
  95: { icon: "⛈️", label: "Thunderstorm" },
  96: { icon: "⛈️", label: "Thunderstorm with light hail" },
  99: { icon: "⛈️", label: "Thunderstorm with heavy hail" },
};

// Animated cloud component
const MovingClouds = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="cloud-1 absolute opacity-20">☁️</div>
    <div className="cloud-2 absolute opacity-20">☁️</div>
    <style jsx>{`
      @keyframes float {
        0% { transform: translateX(-100%) translateY(0); }
        100% { transform: translateX(400%) translateY(10px); }
      }
      .cloud-1 {
        font-size: 100px;
        animation: float 30s linear infinite;
        top: 20%;
      }
      .cloud-2 {
        font-size: 80px;
        animation: float 20s linear infinite;
        top: 40%;
        animation-delay: -15s;
      }
    `}</style>
  </div>
);

// Animated rain component
const RainEffect = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <div
        key={i}
        className="rain-drop absolute bg-white/30 w-0.5 h-10"
        style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: `${1 + Math.random() * 0.5}s`,
        }}
      />
    ))}
    <style jsx>{`
      @keyframes rain {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100vh); }
      }
      .rain-drop {
        animation: rain linear infinite;
      }
    `}</style>
  </div>
);

export default function WeatherNow() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("day");
  const [recentSearches, setRecentSearches] = useState([]);
  const hourlyScrollRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    setTimeOfDay(hour >= 6 && hour < 18 ? "day" : "night");
  }, []);

  const fetchWeather = async () => {
    if (!city) return;
    setLoading(true);
    setError("");
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${city}`
      );
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error("City not found");
      }
      const { latitude, longitude, name, country } = geoData.results[0];

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,precipitation_probability,weathercode,relativehumidity_2m,apparent_temperature,windspeed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&past_days=7&forecast_days=7`
      );
      const weatherData = await weatherRes.json();
      
      const now = new Date();
      const currentHour = now.getHours();
      const pastHours = 7 * 24;
      const currentHourIndex = pastHours + currentHour;

      // Process past week data (though not used)
      const pastWeek = weatherData.daily.time.slice(0, 7).map((date, index) => ({
        date: new Date(date),
        weathercode: weatherData.daily.weathercode[index],
        maxTemp: weatherData.daily.temperature_2m_max[index],
        minTemp: weatherData.daily.temperature_2m_min[index],
        precipProb: weatherData.daily.precipitation_probability_max[index],
      }));

      // Process next week data
      const nextWeek = weatherData.daily.time.slice(7).map((date, index) => ({
        date: new Date(date),
        weathercode: weatherData.daily.weathercode[index + 7],
        maxTemp: weatherData.daily.temperature_2m_max[index + 7],
        minTemp: weatherData.daily.temperature_2m_min[index + 7],
        precipProb: weatherData.daily.precipitation_probability_max[index + 7],
      }));

      // Get hourly forecast for next 24 hours
      const next24Hours = weatherData.hourly.time
        .slice(currentHourIndex, currentHourIndex + 24)
        .map((time, index) => ({
          time: new Date(time),
          temp: weatherData.hourly.temperature_2m[currentHourIndex + index],
          apparentTemp: weatherData.hourly.apparent_temperature[currentHourIndex + index],
          weathercode: weatherData.hourly.weathercode[currentHourIndex + index],
          humidity: weatherData.hourly.relativehumidity_2m[currentHourIndex + index],
          windspeed: weatherData.hourly.windspeed_10m[currentHourIndex + index],
          precipProb: weatherData.hourly.precipitation_probability[currentHourIndex + index],
        }));

      const weatherCode = weatherData.current_weather.weathercode;
      const currentWeather = {
        ...weatherData.current_weather,
        city: name,
        country: country,
        weatherInfo: weatherCodeToInfo[weatherCode] || weatherCodeToInfo[0],
        hourlyForecast: next24Hours.map(hour => ({
          ...hour,
          weatherInfo: weatherCodeToInfo[hour.weathercode] || weatherCodeToInfo[0]
        })),
        pastWeek: pastWeek.map(day => ({
          ...day,
          weatherInfo: weatherCodeToInfo[day.weathercode] || weatherCodeToInfo[0]
        })),
        nextWeek: nextWeek.map(day => ({
          ...day,
          weatherInfo: weatherCodeToInfo[day.weathercode] || weatherCodeToInfo[0]
        })),
        details: {
          humidity: weatherData.hourly.relativehumidity_2m[currentHourIndex],
          apparentTemp: weatherData.hourly.apparent_temperature[currentHourIndex],
          precipProb: weatherData.hourly.precipitation_probability[currentHourIndex],
        }
      };
      
      setWeather(currentWeather);
      setRecentSearches(prev => {
        const updated = [{ name, country }, ...prev.filter(s => s.name !== name)].slice(0, 3);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      setError(err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchWeather();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-sky-100 to-sky-200 transition-colors duration-1000 p-4 relative overflow-y-auto">
      {/* Weather effects based on weather code */}
      {weather?.weathercode >= 51 && weather?.weathercode <= 65 && <RainEffect />}
      {weather?.weathercode <= 3 && <MovingClouds />}

      <div className="w-full max-w-6xl mx-auto z-10 px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">Weather Now</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get accurate weather forecasts for any city around the world. Plan your day with confidence.
          </p>
        </div>

  <div className="bg-gradient-to-br from-sky-50 to-sky-100 backdrop-blur-md rounded-3xl p-8 mb-8 shadow-lg ring-1 ring-white/40">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter city name"
              className="flex-1 p-4 text-lg rounded-full bg-sky-50/80 text-gray-800 placeholder-gray-500 
                focus:ring-0 focus:bg-sky-50 shadow-md transition-all"
            />
            <button
              onClick={fetchWeather}
              disabled={loading}
              className="px-8 py-4 rounded-full font-semibold text-white bg-gradient-to-r from-blue-400 to-indigo-500 
                hover:from-blue-500 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 shadow-md text-lg"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {recentSearches.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-6">
              <span className="text-gray-700 text-lg my-auto">Recent searches:</span>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCity(`${search.name}`);
                    fetchWeather();
                  }}
                  className="text-lg text-white bg-gradient-to-r from-blue-400 to-indigo-500 px-4 py-2 rounded-full hover:from-blue-500 hover:to-indigo-600 
                    transition-all duration-200 shadow-sm"
                >
                  {search.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-6 rounded-3xl mb-8 text-center shadow-lg text-lg">
            {error}
          </div>
        )}

        {weather && (
          <div className="space-y-8">
            {/* Main Weather Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Current Weather */}
              <div className="bg-gradient-to-br from-blue-400 to-indigo-500 backdrop-blur-md rounded-3xl p-8 text-center shadow-lg">
                <h2 className="text-4xl font-bold text-white mb-4">{weather.city}, {weather.country}</h2>
                <span className="text-10xl block my-4">{weather.weatherInfo.icon}</span>
                <p className="text-9xl font-thin text-white">{Math.round(weather.temperature)}°</p>
                <p className="text-2xl text-white mt-4">{weather.weatherInfo.label}</p>
                <div className="flex justify-center gap-6 mt-4 text-white text-xl">
                  <span>H: {Math.round(weather.nextWeek[0].maxTemp)}°</span>
                  <span>L: {Math.round(weather.nextWeek[0].minTemp)}°</span>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: "Feels Like", value: `${Math.round(weather.details.apparentTemp)}°`, icon: "🌡️" },
                  { label: "Humidity", value: `${weather.details.humidity}%`, icon: "💧" },
                  { label: "Wind Speed", value: `${weather.windspeed} km/h`, icon: "💨" },
                  { label: "Rain Chance", value: `${weather.details.precipProb}%`, icon: "🌧️" },
                ].map((detail, index) => (
                  <div key={index} className="bg-gradient-to-br from-sky-50 to-sky-100 backdrop-blur-md rounded-3xl p-6 shadow-lg ring-1 ring-white/30">
                    <p className="text-lg text-gray-700 mb-2">{detail.label}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-3xl text-gray-800">{detail.value}</p>
                      <span className="text-4xl opacity-70">{detail.icon}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hourly Forecast */}
            <div className="bg-gradient-to-br from-sky-50 to-sky-100 backdrop-blur-md rounded-3xl p-6 shadow-lg ring-1 ring-white/30">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">Hourly Forecast</h3>
              <div 
                ref={hourlyScrollRef}
                className="flex overflow-x-auto gap-6 pb-4">
                {weather.hourlyForecast.map((hour, index) => (
                  <div key={index} className="flex-none flex flex-col items-center min-w-[80px] bg-gradient-to-b from-blue-100 to-indigo-100 p-4 rounded-2xl shadow-sm">
                    <p className="text-lg text-gray-700 mb-2">
                      {index === 0 ? 'Now' : hour.time.toLocaleTimeString([], { hour: 'numeric' })}
                    </p>
                    <span className="text-3xl mb-2">{hour.weatherInfo.icon}</span>
                    <p className="text-xl text-gray-800">{Math.round(hour.temp)}°</p>
                    <p className="text-sm text-gray-600 mt-2">{hour.precipProb}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 7-Day Forecast */}
            <div className="bg-gradient-to-br from-sky-50 to-sky-100 backdrop-blur-md rounded-3xl p-6 shadow-lg ring-1 ring-white/30">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">7-Day Forecast</h3>
              <div className="space-y-5">
                {weather.nextWeek.map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <p className="text-xl text-gray-800 w-28">
                      {index === 0 ? 'Today' : day.date.toLocaleDateString('en-US', { weekday: 'long' })}
                    </p>
                    <span className="text-3xl w-16 text-center">{day.weatherInfo.icon}</span>
                    <div className="flex-1 mx-6">
                      <div className="bg-gray-200 h-2 rounded-full">
                        <div 
                          className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2 rounded-full"
                          style={{
                            width: `${((day.maxTemp - day.minTemp) / 50 * 100)}%`,
                            transform: `translateX(${(day.minTemp + 50) / 100 * 100}%)`
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-xl text-gray-600 w-16 text-right">{Math.round(day.minTemp)}°</p>
                    <p className="text-xl text-gray-800 w-16 text-right">{Math.round(day.maxTemp)}°</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <footer className="bg-gradient-to-br from-blue-400 to-indigo-500 backdrop-blur-md rounded-3xl p-8 mt-10 text-center shadow-lg">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-center mb-6">
                  <span className="text-4xl mr-3">🌤️</span>
                  <p className="text-3xl font-semibold text-white">Weather Now</p>
                </div>
                <p className="text-white/90 text-xl mb-6">Your accurate weather forecasting app for planning your day</p>
                
                <div className="flex flex-wrap justify-center gap-6 text-lg text-white mb-6">
                  <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" 
                    className="hover:text-white/80 transition-colors">
                    Data Source
                  </a>
                  <span className="text-white/60">•</span>
                  <a href="#" className="hover:text-white/80 transition-colors">
                    Privacy Policy
                  </a>
                  <span className="text-white/60">•</span>
                  <a href="#" className="hover:text-white/80 transition-colors">
                    Terms of Service
                  </a>
                </div>
                
                <div className="pt-6 border-t border-white/20">
                  <p className="text-sm text-white/70">
                    © {new Date().getFullYear()} Weather Now. All rights reserved.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}