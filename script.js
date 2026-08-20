const { useEffect, useState } = React;

const demoWeather = {
  place: "San Francisco, CA",
  timezone: "America/Los_Angeles",
  current: {
    temperature_2m: 19,
    apparent_temperature: 19,
    relative_humidity_2m: 67,
    wind_speed_10m: 14,
    weather_code: 2,
  },
  hourly: {
    time: Array.from(
      { length: 24 },
      (_, i) => `2025-01-01T${String(i).padStart(2, "0")}:00`,
    ),
    temperature_2m: [
      15, 15, 16, 16, 17, 18, 19, 19, 20, 20, 21, 20, 20, 19, 19, 18, 17, 17,
      16, 16, 15, 15, 15, 15,
    ],
    precipitation_probability: [
      4, 3, 3, 5, 4, 4, 5, 7, 8, 6, 5, 5, 4, 4, 3, 3, 5, 6, 8, 9, 8, 6, 5, 5,
    ],
  },
  daily: {
    time: ["Today", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"],
    temperature_2m_max: [21, 20, 22, 19, 18, 20, 21],
    temperature_2m_min: [13, 12, 14, 13, 12, 13, 14],
    weather_code: [2, 3, 1, 61, 3, 2, 1],
  },
};

const weatherLabels = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Rime fog",
  51: "Light drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  80: "Rain showers",
  95: "Thunderstorms",
};
const weatherIcons = {
  0: "sun",
  1: "sun",
  2: "cloud-sun",
  3: "cloud",
  45: "cloud-fog",
  48: "cloud-fog",
  51: "cloud-drizzle",
  61: "cloud-rain",
  63: "cloud-rain",
  65: "cloud-rain",
  80: "cloud-rain",
  95: "cloud-lightning",
};

function Icon({ name, size = 20, strokeWidth = 2 }) {
  return (
    <i
      className="icon"
      data-lucide={name}
      style={{ width: size, height: size, strokeWidth }}
      aria-hidden="true"
    ></i>
  );
}

function WeatherIcon({ code, size = 28 }) {
  return <Icon name={weatherIcons[code] || "cloud"} size={size} />;
}
function formatHour(time) {
  return new Date(time)
    .toLocaleTimeString([], { hour: "numeric" })
    .replace(" ", "");
}

async function fetchWeather(query) {
  const locationResponse = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
  );
  const locationData = await locationResponse.json();
  if (!locationData.results?.length) throw new Error("Location not found");
  const location = locationData.results[0];
  const weatherResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto&forecast_days=7`,
  );
  const weatherData = await weatherResponse.json();
  return {
    ...weatherData,
    place: `${location.name}${location.admin1 ? `, ${location.admin1}` : ""}`,
  };
}

function App() {
  const [weather, setWeather] = useState(demoWeather);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState("C");
  useEffect(() => {
    window.lucide?.createIcons();
  }, [weather, unit, loading, error]);

  const search = async (event) => {
    event?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      setWeather(await fetchWeather(query.trim()));
      setQuery("");
    } catch (err) {
      setError("We couldn't find that place. Try a city or country name.");
    } finally {
      setLoading(false);
    }
  };

  const current = weather.current;
  const convert = (value) =>
    unit === "C" ? Math.round(value) : Math.round((value * 9) / 5 + 32);
  const degrees = (value) => `${convert(value)}°`;
  const todayLabel =
    weather.place === demoWeather.place
      ? "Wednesday, January 15"
      : new Date().toLocaleDateString([], {
          weekday: "long",
          month: "long",
          day: "numeric",
        });
  const hourlyStart = weather.hourly.time.findIndex(
    (time) => new Date(time).getHours() >= new Date().getHours(),
  );
  const hours = Array.from(
    { length: 8 },
    (_, i) => (hourlyStart >= 0 ? hourlyStart : 0) + i,
  ).map((i) => ({
    time: weather.hourly.time[i % weather.hourly.time.length],
    temp: weather.hourly.temperature_2m[
      i % weather.hourly.temperature_2m.length
    ],
    rain: weather.hourly.precipitation_probability[
      i % weather.hourly.precipitation_probability.length
    ],
  }));

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-mark">
            <Icon name="cloud-sun" size={21} />
          </span>
          <span>
            skyline<span className="brand-dot">.</span>
          </span>
        </a>
        <form className="search" onSubmit={search}>
          <Icon name="search" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city, region or country"
            aria-label="Search location"
          />
          <button type="submit" aria-label="Search">
            <Icon name="arrow-up-right" size={18} />
          </button>
        </form>
        <div className="top-actions">
          <button
            className="icon-button"
            aria-label="Use current location"
            title="Use current location"
            onClick={() => {
              setQuery("San Francisco");
            }}
          >
            <Icon name="navigation" size={18} />
          </button>
          <div className="unit-toggle">
            <button
              className={unit === "C" ? "active" : ""}
              onClick={() => setUnit("C")}
            >
              °C
            </button>
            <button
              className={unit === "F" ? "active" : ""}
              onClick={() => setUnit("F")}
            >
              °F
            </button>
          </div>
          <div className="avatar">JD</div>
        </div>
      </header>
      <main id="top">
        <div className="page-heading">
          <div>
            <p className="eyebrow">
              <span className="live-dot"></span> Live conditions
            </p>
            <h1>Good morning, Aman.</h1>
            <p className="muted">Here's what's happening with the sky today.</p>
          </div>
          <div className="updated">
            <Icon name="refresh-cw" size={14} /> Updated just now
          </div>
        </div>
        {error && (
          <div className="error">
            <Icon name="alert-circle" size={16} />
            {error}
          </div>
        )}
        <section className="hero-grid">
          <article className="current-card">
            <div className="card-top">
              <div>
                <p className="location">
                  <Icon name="map-pin" size={16} /> {weather.place}
                </p>
                <p className="date">{todayLabel}</p>
              </div>
              <button className="more" aria-label="More weather options">
                <Icon name="more-horizontal" size={20} />
              </button>
            </div>
            <div className="current-main">
              <div className="big-weather-icon">
                <WeatherIcon code={current.weather_code} size={76} />
              </div>
              <div className="temperature">
                <strong>{degrees(current.temperature_2m)}</strong>
                <span>
                  {weatherLabels[current.weather_code] || "Partly cloudy"}
                </span>
              </div>
            </div>
            <div className="feels">
              Feels like {degrees(current.apparent_temperature)}
            </div>
            <div className="stats">
              <div>
                <span>
                  <Icon name="droplets" size={16} /> Humidity
                </span>
                <b>{current.relative_humidity_2m}%</b>
              </div>
              <div>
                <span>
                  <Icon name="wind" size={16} /> Wind
                </span>
                <b>{Math.round(current.wind_speed_10m)} km/h</b>
              </div>
              <div>
                <span>
                  <Icon name="sunrise" size={16} /> UV index
                </span>
                <b>Low</b>
              </div>
            </div>
          </article>
          <article className="sun-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">Sun path</p>
                <h2>Daylight hours</h2>
              </div>
              <Icon name="sun" size={23} />
            </div>
            <div className="sun-arc">
              <div className="arc-line"></div>
              <div className="sun-ball">
                <Icon name="sun" size={17} />
              </div>
              <span className="arc-start">7:24 AM</span>
              <span className="arc-end">5:18 PM</span>
            </div>
            <div className="sun-times">
              <div>
                <span>Sunrise</span>
                <b>7:24 AM</b>
              </div>
              <div>
                <span>Sunset</span>
                <b>5:18 PM</b>
              </div>
              <div>
                <span>Remaining</span>
                <b>5h 42m</b>
              </div>
            </div>
          </article>
        </section>
        <section className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Next 24 hours</p>
              <h2>Hourly forecast</h2>
            </div>
            <button className="text-button">
              See full forecast <Icon name="arrow-right" size={16} />
            </button>
          </div>
          <div className="hourly-row">
            {hours.map((hour, index) => (
              <div
                className={`hour ${index === 0 ? "now" : ""}`}
                key={`${hour.time}-${index}`}
              >
                <span>{index === 0 ? "Now" : formatHour(hour.time)}</span>
                <WeatherIcon
                  code={current.weather_code}
                  size={index === 0 ? 27 : 24}
                />
                <b>{degrees(hour.temp)}</b>
                <small>
                  <Icon name="droplets" size={12} />
                  {hour.rain}%
                </small>
              </div>
            ))}
          </div>
        </section>
        <section className="section forecast-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Plan ahead</p>
              <h2>7-day forecast</h2>
            </div>
            <div className="legend">
              <span className="legend-high"></span> High{" "}
              <span className="legend-low"></span> Low
            </div>
          </div>
          <div className="forecast-list">
            {weather.daily.time.map((day, index) => (
              <div
                className={`forecast-day ${index === 0 ? "today" : ""}`}
                key={day}
              >
                <b>{index === 0 ? "Today" : day}</b>
                <WeatherIcon
                  code={weather.daily.weather_code[index]}
                  size={25}
                />
                <span className="forecast-label">
                  {weatherLabels[weather.daily.weather_code[index]] ||
                    "Mostly clear"}
                </span>
                <div className="temp-range">
                  <strong>
                    {degrees(weather.daily.temperature_2m_max[index])}
                  </strong>
                  <div className="range">
                    <i style={{ left: `${index * 12}%`, width: "30%" }}></i>
                  </div>
                  <span>
                    {degrees(weather.daily.temperature_2m_min[index])}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer>
        <span>Data by Open-Meteo</span>
        <span>Forecasts are updated automatically</span>
      </footer>
      {loading && (
        <div className="loading">
          <span></span> Finding your forecast...
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
