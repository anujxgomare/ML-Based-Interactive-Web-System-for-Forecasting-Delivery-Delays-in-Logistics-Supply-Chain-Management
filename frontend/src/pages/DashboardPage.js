import React, { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import { fetchStats, fetchPredictions, exportCSV } from "../services/api";
import toast from "react-hot-toast";
import {
  LayoutDashboard, Download, RefreshCw, TrendingUp,
  Package, AlertCircle, CheckCircle, Activity
} from "lucide-react";
import { format } from "date-fns";

const RISK_COLORS = { Low: "#00ff88", Medium: "#ffd166", High: "#ff6b35", Critical: "#ff4d6d" };

export default function DashboardPage() {
  const [stats, setStats]       = useState(null);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, h] = await Promise.all([fetchStats(), fetchPredictions(0, 100)]);
      setStats(s);
      setHistory(h);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived chart data ──────────────────────────────────────────────────────
  const pieData = stats
    ? [
        { name: "On Time", value: stats.total_predictions - stats.total_delayed, color: "#00ff88" },
        { name: "Delayed",  value: stats.total_delayed, color: "#ff4d6d" },
      ]
    : [];

  const riskTrend = history
    .slice(0, 20)
    .reverse()
    .map((r, i) => ({
      index: i + 1,
      risk: Math.round(r.probability_score * 100),
      label: `#${r.id}`,
    }));

  const shippingModeData = history.reduce((acc, r) => {
    const key = r.shipping_mode;
    const existing = acc.find((x) => x.mode === key);
    if (existing) {
      existing.total++;
      if (r.predicted_delay) existing.delayed++;
    } else {
      acc.push({ mode: key, total: 1, delayed: r.predicted_delay ? 1 : 0 });
    }
    return acc;
  }, []);

  const weatherData = history.reduce((acc, r) => {
    const key = r.weather_condition;
    const ex  = acc.find((x) => x.weather === key);
    if (ex) { ex.count++; if (r.predicted_delay) ex.delayed++; }
    else acc.push({ weather: key, count: 1, delayed: r.predicted_delay ? 1 : 0 });
    return acc;
  }, []);

  const handleExport = () => { exportCSV(); toast.success("CSV export started!"); };

  const getRiskLevel = (score) => {
    if (score < 0.35) return "Low";
    if (score < 0.6)  return "Medium";
    if (score < 0.8)  return "High";
    return "Critical";
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div className="spinner" style={{ width: 40, height: 40, margin: "0 auto 16px" }} />
        <div style={{ color: "#8fa3c8", fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          Loading dashboard...
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div style={S.titleRow}>
        <div>
          <h1 style={S.title}>
            <LayoutDashboard size={24} style={{ verticalAlign: "middle", marginRight: 10, color: "#00e5ff" }} />
            Analytics Dashboard
          </h1>
          <p style={S.subtitle}>Real-time delivery delay forecasting insights</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div style={S.statsGrid}>
        <StatCard
          icon={<Package size={20} />}
          label="Total Predictions"
          value={stats?.total_predictions ?? 0}
          color="#00e5ff"
          sub="all time"
        />
        <StatCard
          icon={<AlertCircle size={20} />}
          label="Delayed"
          value={stats?.total_delayed ?? 0}
          color="#ff4d6d"
          sub={`${stats?.delay_percentage ?? 0}% of total`}
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          label="On Time"
          value={(stats?.total_predictions ?? 0) - (stats?.total_delayed ?? 0)}
          color="#00ff88"
          sub={`${(100 - (stats?.delay_percentage ?? 0)).toFixed(1)}% of total`}
        />
        <StatCard
          icon={<Activity size={20} />}
          label="Avg Risk Score"
          value={`${Math.round((stats?.avg_risk_score ?? 0) * 100)}%`}
          color="#ffd166"
          sub="mean probability"
        />
      </div>

      {/* ── Charts Row 1 ───────────────────────────────────────────────────── */}
      <div style={S.chartsRow}>
        {/* Delay Distribution Pie */}
        <div className="card animate-fade-in-up">
          <div style={S.chartTitle}>Delay Distribution</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData} cx="50%" cy="50%"
                innerRadius={60} outerRadius={90}
                paddingAngle={3} dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#1a2235", border: "1px solid #2a3550", borderRadius: 8 }}
                itemStyle={{ color: "#e8edf5", fontFamily: "'IBM Plex Mono',monospace", fontSize: 12 }}
              />
              <Legend
                formatter={(v) => <span style={{ color: "#8fa3c8", fontFamily: "'IBM Plex Mono',monospace", fontSize: 11 }}>{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Score Trend */}
        <div className="card animate-fade-in-up animate-delay-1" style={{ flex: 2 }}>
          <div style={S.chartTitle}>
            <TrendingUp size={14} /> Risk Score Trend (Last 20)
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={riskTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3550" />
              <XAxis dataKey="label" tick={tickStyle} />
              <YAxis domain={[0, 100]} tick={tickStyle} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [`${v}%`, "Risk Score"]}
              />
              <Line
                type="monotone" dataKey="risk" stroke="#00e5ff"
                strokeWidth={2} dot={{ fill: "#00e5ff", r: 3 }}
                activeDot={{ r: 5, fill: "#00e5ff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Charts Row 2 ───────────────────────────────────────────────────── */}
      <div style={S.chartsRow}>
        {/* Shipping Mode Bar */}
        <div className="card animate-fade-in-up animate-delay-2" style={{ flex: 1 }}>
          <div style={S.chartTitle}>Delays by Shipping Mode</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={shippingModeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3550" />
              <XAxis dataKey="mode" tick={tickStyle} />
              <YAxis tick={tickStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="total"   fill="#2a3550"  name="Total"   radius={[4,4,0,0]} />
              <Bar dataKey="delayed" fill="#ff4d6d"  name="Delayed" radius={[4,4,0,0]} />
              <Legend formatter={(v) => <span style={{ color: "#8fa3c8", fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" }}>{v}</span>} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weather Impact Bar */}
        <div className="card animate-fade-in-up animate-delay-3" style={{ flex: 1 }}>
          <div style={S.chartTitle}>Delays by Weather</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weatherData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3550" />
              <XAxis dataKey="weather" tick={tickStyle} />
              <YAxis tick={tickStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count"   fill="#2a3550"  name="Total"   radius={[4,4,0,0]} />
              <Bar dataKey="delayed" fill="#ff6b35"  name="Delayed" radius={[4,4,0,0]} />
              <Legend formatter={(v) => <span style={{ color: "#8fa3c8", fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" }}>{v}</span>} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Recent Predictions Table ────────────────────────────────────────── */}
      <div className="card animate-fade-in-up" style={{ marginTop: 0, overflow: "hidden" }}>
        <div style={{ ...S.chartTitle, marginBottom: 16 }}>Recent Predictions</div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Route</th>
                <th>Mode</th>
                <th>Distance</th>
                <th>Weather</th>
                <th>Traffic</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recent_predictions || []).map((r) => {
                const risk = getRiskLevel(r.probability_score);
                const riskColor = RISK_COLORS[risk];
                return (
                  <tr key={r.id}>
                    <td style={{ fontFamily: "'IBM Plex Mono',monospace", color: "#4a5a7a" }}>#{r.id}</td>
                    <td style={{ color: "#e8edf5" }}>
                      {r.warehouse_location} → {r.delivery_location}
                    </td>
                    <td>{r.shipping_mode}</td>
                    <td style={{ fontFamily: "'IBM Plex Mono',monospace" }}>{r.distance_km} km</td>
                    <td>{r.weather_condition}</td>
                    <td>{r.traffic_level}</td>
                    <td>
                      <span className={`badge ${r.predicted_delay ? "badge-red" : "badge-green"}`}>
                        {r.predicted_delay ? "Delayed" : "On Time"}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: "'IBM Plex Mono',monospace",
                        fontSize: 12, fontWeight: 600,
                        color: riskColor,
                      }}>
                        {Math.round(r.probability_score * 100)}%
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: "#4a5a7a", fontFamily: "'IBM Plex Mono',monospace" }}>
                      {format(new Date(r.timestamp), "MMM d, HH:mm")}
                    </td>
                  </tr>
                );
              })}
              {(!stats?.recent_predictions?.length) && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", color: "#4a5a7a", padding: "32px 16px" }}>
                    No predictions yet. Run your first prediction!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="card animate-fade-in-up" style={{ borderTop: `2px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ color, opacity: 0.8 }}>{icon}</div>
        <div style={{
          fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#4a5a7a",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          {label}
        </div>
      </div>
      <div style={{
        fontFamily: "'Syne',sans-serif", fontSize: 36, fontWeight: 800,
        color, lineHeight: 1, margin: "12px 0 4px",
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#4a5a7a", fontFamily: "'IBM Plex Mono',monospace" }}>{sub}</div>
    </div>
  );
}

const tickStyle = { fill: "#4a5a7a", fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" };
const tooltipStyle = { background: "#1a2235", border: "1px solid #2a3550", borderRadius: 8,
  fontFamily: "'IBM Plex Mono',monospace", fontSize: 12 };

const S = {
  titleRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12,
  },
  title: { fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: "#e8edf5" },
  subtitle: { color: "#8fa3c8", fontSize: 13, marginTop: 4, fontFamily: "'IBM Plex Mono',monospace" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 },
  chartsRow: { display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 },
  chartTitle: {
    display: "flex", alignItems: "center", gap: 6,
    fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 600,
    color: "#4a5a7a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
  },
};
