import React, { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import "../styles/Dashboard.css";
import irrigationBg from "../assets/irrigation-bg.jpg";

const COLORS = ["#0088FE", "#00C49F", "#FF8042"];

const GroundwaterDashboard = () => {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState([]);
  const [currentMonthData, setCurrentMonthData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);

  // For filtering by location (you can expand this with your real locations)
  const sampleLocations = [
    { name: "Village A", lat: 12.9716, lon: 77.5946 },
    { name: "Village B", lat: 28.7041, lon: 77.1025 },
    { name: "Village C", lat: 19.0760, lon: 72.8777 },
  ];
  const [selectedLocation, setSelectedLocation] = useState("");

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getLevelClass = (level) => {
    const l = level.toLowerCase();
    if (l === "low") return "level- low";
    if (l === "moderate") return "level-moderate";
    if (l === "high") return "level-high";
    return "";
  };

  // Helper to count how many months are Low/Moderate/High
  const waterLevelCounts = () => {
    const counts = { Low: 0, Moderate: 0, High: 0 };
    data.forEach((d) => {
      const lvl = d.level;
      if (counts[lvl] !== undefined) counts[lvl]++;
    });
    return counts;
  };

  const pieData = () => {
    const counts = waterLevelCounts();
    return [
      { name: "Low", value: counts.Low },
      { name: "Moderate", value: counts.Moderate },
      { name: "High", value: counts.High },
    ];
  };

  const handlePredict = async () => {
    let lat, lon;

    setError("");
    setShowDashboard(false);
    setCurrentMonthData(null);
    setSelectedMonth(null);
    setData([]);

    // If location selected from dropdown, use that
    if (selectedLocation) {
      const loc = sampleLocations.find(loc => loc.name === selectedLocation);
      lat = loc.lat;
      lon = loc.lon;
      setLatitude(lat);
      setLongitude(lon);
    } else {
      lat = parseFloat(latitude);
      lon = parseFloat(longitude);
    }

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError("Enter a valid latitude (-90 to 90)");
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setError("Enter a valid longitude (-180 to 180)");
      return;
    }

    try {
      const res = await fetch("https://groundwater-level-api.onrender.com/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lon })
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Something went wrong.");
        return;
      }
      const result = await res.json();
      setData(result);

      const currentMonth = new Date().getMonth() + 1;
      const current = result.find((d) => d.month === currentMonth);
      setCurrentMonthData(current);
      setSelectedMonth(currentMonth);
      setShowDashboard(true);
    } catch (err) {
      setError("Error connecting to the backend.");
    }
  };

  const chartData = data.map((item) => ({
    month: monthNames[item.month - 1],
    level: item.level === "Low" ? 1 : item.level === "Moderate" ? 2 : 3
  }));

  return (
    <div
      className="container"
      style={{
        backgroundImage: `url(${irrigationBg})`,
        backgroundSize: "cover",
        minHeight: "100vh",
        padding: "20px",
        color: "#fff",
        textShadow: "0 0 5px #000"
      }}
    >
      <h1>Groundwater Level Forecast</h1>
      <div className="header-with-gif">
  <img
    src="https://c.tenor.com/sr8g_XsZYDEAAAAC/raining-sparkle.gif"
    alt="Water drop animation"
    className="water-drop-gif"
  />
</div>


      {/* Location Selector */}
      <div className="form-group">
        <label>Select Location:</label>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          <option value="">-- Or enter manually --</option>
          {sampleLocations.map((loc) => (
            <option key={loc.name} value={loc.name}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedLocation && (
        <>
          <div className="form-group">
            <label>Latitude (-90 to 90):</label>
            <input
              type="number"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="Enter latitude"
            />
          </div>

          <div className="form-group">
            <label>Longitude (-180 to 180):</label>
            <input
              type="number"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="Enter longitude"
            />
          </div>
        </>
      )}

      <button onClick={handlePredict}>Get Forecast</button>

      {error && <div className="error">{error}</div>}

      {showDashboard && (
        <div className="dashboard">
          {/* Pie Chart Section */}
          <div className="pie-section">
            <h3>Water Level Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData()}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {pieData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
            <div className="level-numbers">
              {Object.entries(waterLevelCounts()).map(([level, count]) => (
                <div key={level} className={`level-count ${getLevelClass(level)}`}>
                  {level}: {count}
                </div>
              ))}
            </div>
          </div>

          {/* Current Month Forecast Card */}
          <div className="card">
            <h2>{monthNames[currentMonthData.month - 1]} Forecast</h2>
            <p>
              <strong>Groundwater Level:</strong>{" "}
              <span className={getLevelClass(currentMonthData.level)}>
                {currentMonthData.level}
              </span>
            </p>
            <p>
              <strong>Temperature:</strong> {(25 + Math.random() * 5).toFixed(1)} °C
            </p>
            <p>
              <strong>Humidity:</strong> {(50 + Math.random() * 20).toFixed(0)} %
            </p>
          </div>

          {/* Month Selector and Info */}
          <div className="form-group">
            <label>Explore Another Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {data.map((item) => (
                <option key={item.month} value={item.month}>
                  {monthNames[item.month - 1]}
                </option>
              ))}
            </select>
          </div>

          {selectedMonth && (
            <div className="card">
              <h2>{monthNames[selectedMonth - 1]}</h2>
              <p>
                <strong>Groundwater Level:</strong>{" "}
                <span
                  className={getLevelClass(data.find((d) => d.month === selectedMonth).level)}
                >
                  {data.find((d) => d.month === selectedMonth).level}
                </span>
              </p>
            </div>
          )}

          {/* Line Chart */}
          <h3 style={{ marginTop: "40px" }}>Monthly Forecast Flow</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                        ticks={[1, 2, 3]}
                        domain={[1, 3]}
                        tickFormatter={(val) => {
                          const levelMap = {
                            1: "Low",
                            2: "Moderate",
                            3: "High",
                          };
                          return levelMap[val] || "";
                        }}
                      />

              <Tooltip formatter={(value) => {
                          const levelMap = {
                            1: "Low",
                            2: "Moderate",
                            3: "High"
                          };
                          return levelMap[value] || "";
                        }} />

              <Line type="monotone" dataKey="level" stroke="#007bff" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default GroundwaterDashboard;
