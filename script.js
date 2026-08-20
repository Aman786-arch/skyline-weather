const { useEffect, useRef, useState } = React;

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

function SkyScene({ theme }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!window.THREE || !canvasRef.current) return undefined;
    const THREE = window.THREE;
    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.2, 9);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const globe = new THREE.Group();
    const compactViewport = window.innerWidth < 760;
    globe.position.set(
      compactViewport ? 0.85 : 2.3,
      compactViewport ? 1.25 : 0.55,
      -0.65,
    );
    globe.rotation.set(-0.16, -0.42, 0.08);
    scene.add(globe);

    const blue = theme === "dark" ? 0x1d6590 : 0x79bfe7;
    const paleBlue = theme === "dark" ? 0x92d5f5 : 0xdff4ff;
    const accent = theme === "dark" ? 0x72c5ff : 0x3c9ad5;
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");
    const earthTexture = textureLoader.load(
      "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57730/land_ocean_ice_2048.png",
    );
    const earthNormal = textureLoader.load(
      "https://threejs.org/examples/textures/planets/earth_normal_2048.jpg",
    );
    const earthSpecular = textureLoader.load(
      "https://threejs.org/examples/textures/planets/earth_specular_2048.jpg",
    );
    const earthLights = textureLoader.load(
      "https://threejs.org/examples/textures/planets/earth_lights_2048.png",
    );
    const cloudTexture = textureLoader.load(
      "https://threejs.org/examples/textures/planets/earth_clouds_1024.png",
    );

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(2.08, 64, 64),
      new THREE.MeshPhongMaterial({
        color: 0xffffff,
        map: earthTexture,
        bumpMap: earthNormal,
        bumpScale: 0.06,
        specularMap: earthSpecular,
        specular: new THREE.Color(0x6da8c8),
        shininess: 16,
        emissiveMap: earthLights,
        emissive: new THREE.Color(0x31586b),
        emissiveIntensity: theme === "dark" ? 0.6 : 0.25,
      }),
    );
    globe.add(earth);

    const grid = new THREE.Group();
    const gridMaterial = new THREE.LineBasicMaterial({
      color: paleBlue,
      transparent: true,
      opacity: 0.2,
    });
    for (let latitude = -60; latitude <= 60; latitude += 30) {
      const radius = Math.cos(THREE.MathUtils.degToRad(latitude)) * 2.095;
      const y = Math.sin(THREE.MathUtils.degToRad(latitude)) * 2.095;
      const points = [];
      for (let segment = 0; segment <= 96; segment += 1) {
        const angle = (segment / 96) * Math.PI * 2;
        points.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            y,
            Math.sin(angle) * radius,
          ),
        );
      }
      grid.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          gridMaterial,
        ),
      );
    }
    for (let longitude = 0; longitude < 180; longitude += 30) {
      const points = [];
      const angle = THREE.MathUtils.degToRad(longitude);
      for (let segment = 0; segment <= 64; segment += 1) {
        const phi = (segment / 64) * Math.PI - Math.PI / 2;
        points.push(
          new THREE.Vector3(
            Math.cos(phi) * Math.cos(angle) * 2.1,
            Math.sin(phi) * 2.1,
            Math.cos(phi) * Math.sin(angle) * 2.1,
          ),
        );
      }
      grid.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          gridMaterial,
        ),
      );
    }
    globe.add(grid);

    const cloudShell = new THREE.Mesh(
      new THREE.SphereGeometry(2.16, 48, 48),
      new THREE.MeshPhongMaterial({
        color: 0xffffff,
        map: cloudTexture,
        transparent: true,
        opacity: 0.65,
        depthTest: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    cloudShell.scale.set(1.01, 0.98, 1.02);
    globe.add(cloudShell);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.28, 48, 48),
      new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.14,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    );
    globe.add(atmosphere);

    const orbit = new THREE.Group();
    [2.72, 2.92].forEach((radius, index) => {
      const line = new THREE.Mesh(
        new THREE.TorusGeometry(radius, index ? 0.008 : 0.014, 8, 128),
        new THREE.MeshBasicMaterial({
          color: accent,
          transparent: true,
          opacity: index ? 0.2 : 0.38,
        }),
      );
      line.rotation.set(index ? 1.05 : 0.62, index ? -0.2 : 0.4, 0.2);
      orbit.add(line);
    });
    globe.add(orbit);

    const dataArc = new THREE.Mesh(
      new THREE.TorusGeometry(2.48, 0.026, 8, 96, Math.PI * 0.72),
      new THREE.MeshBasicMaterial({
        color: 0xffbd72,
        transparent: true,
        opacity: 0.9,
      }),
    );
    dataArc.rotation.set(0.3, 0.8, -0.45);
    globe.add(dataArc);

    const stormCount = 140;
    const stormPositions = new Float32Array(stormCount * 3);
    for (let i = 0; i < stormCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.5 + Math.random() * 1.05;
      stormPositions[i * 3] = Math.cos(angle) * radius;
      stormPositions[i * 3 + 1] = (Math.random() - 0.5) * 4.8;
      stormPositions[i * 3 + 2] = Math.sin(angle) * radius - 0.5;
    }
    const stormGeometry = new THREE.BufferGeometry();
    stormGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(stormPositions, 3),
    );
    const stormField = new THREE.Points(
      stormGeometry,
      new THREE.PointsMaterial({
        color: accent,
        size: 0.025,
        transparent: true,
        opacity: 0.65,
      }),
    );
    scene.add(stormField);

    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(0.68, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffbf70,
        emissive: 0xff8e45,
        emissiveIntensity: 0.7,
        roughness: 0.5,
      }),
    );
    sun.position.set(-3.2, 2.7, -1.8);
    scene.add(sun);
    const sunHalo = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffbd72,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide,
      }),
    );
    sunHalo.position.copy(sun.position);
    scene.add(sunHalo);

    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const keyLight = new THREE.PointLight(0xffc77b, 18, 18);
    keyLight.position.copy(sun.position);
    scene.add(keyLight);

    const pointer = { x: 0, y: 0 };
    const move = (event) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", move, { passive: true });
    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      globe.rotation.y += 0.0018 + pointer.x * 0.0012;
      globe.rotation.x += (-0.16 + pointer.y * 0.12 - globe.rotation.x) * 0.025;
      cloudShell.rotation.y += 0.0025 + pointer.x * 0.0018;
      grid.rotation.y += 0.0008;
      orbit.rotation.z += 0.0012;
      dataArc.rotation.z += 0.003;
      stormField.rotation.y -= 0.0007;
      camera.position.x += (pointer.x * 0.7 - camera.position.x) * 0.025;
      camera.position.y += (0.2 - pointer.y * 0.35 - camera.position.y) * 0.025;
      camera.lookAt(globe.position.x, globe.position.y, globe.position.z);
      renderer.render(scene, camera);
    };
    animate();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      renderer.dispose();
    };
  }, [theme]);

  return <canvas className="sky-scene" ref={canvasRef} aria-hidden="true" />;
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
  const [theme, setTheme] = useState(
    () => localStorage.getItem("skyline-theme") || "light",
  );
  useEffect(() => {
    window.lucide?.createIcons();
  }, [weather, unit, loading, error]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("skyline-theme", theme);
  }, [theme]);

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
      <SkyScene theme={theme} />
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
          <button
            className="icon-button theme-toggle"
            type="button"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Icon name={theme === "light" ? "moon" : "sun"} size={18} />
          </button>
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
