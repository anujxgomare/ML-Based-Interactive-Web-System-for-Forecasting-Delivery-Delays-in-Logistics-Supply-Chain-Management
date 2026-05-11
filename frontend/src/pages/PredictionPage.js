import React, { useState } from "react";
import { runPrediction } from "../services/api";
import ResultCard from "../components/ResultCard";
import Chatbot from "../components/Chatbot";
import toast from "react-hot-toast";
import { Truck, Send, RotateCcw } from "lucide-react";

const FIELD_OPTS = {
  shipping_mode:     ["Standard", "Express", "Same-Day", "Overnight"],
  weather_condition: ["Clear", "Rainy", "Stormy", "Foggy", "Snowy"],
  traffic_level:     ["Low", "Medium", "High", "Severe"],
  order_priority:    ["Low", "Medium", "High", "Critical"],
};

const DEFAULTS = {
  shipping_mode: "Express",
  distance_km: "350",
  weather_condition: "Clear",
  traffic_level: "Medium",
  order_priority: "High",
  warehouse_location: "Mumbai",
  delivery_location: "Pune",
};

export default function PredictionPage() {
  const [form, setForm]       = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    const dist = parseFloat(form.distance_km);
    if (isNaN(dist) || dist < 1 || dist > 5000)
      return toast.error("Distance must be between 1–5000 km");
    if (!form.warehouse_location.trim() || !form.delivery_location.trim())
      return toast.error("Fill in warehouse and delivery location");

    setLoading(true);
    setResult(null);
    try {
      const res = await runPrediction({ ...form, distance_km: dist });
      setResult(res);
      toast.success("Prediction complete!");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Prediction failed – is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setForm(DEFAULTS); setResult(null); };

  return (
    <div className="page-container">
      {/* Page title */}
      <div style={S.titleRow}>
        <div>
          <h1 style={S.title}>
            <Truck size={24} style={{ verticalAlign: "middle", marginRight: 10, color: "#00e5ff" }} />
            Delay Prediction
          </h1>
          <p style={S.subtitle}>
            Enter shipment parameters to forecast delivery delay probability
          </p>
        </div>
        {result && (
          <button className="btn btn-secondary" onClick={reset}>
            <RotateCcw size={14} /> New Prediction
          </button>
        )}
      </div>

      <div style={S.layout}>
        {/* ── Form ────────────────────────────────────────────────────────── */}
        <div className="card animate-fade-in-up">
          <div style={S.sectionTitle}>Shipment Parameters</div>

          <div style={S.grid}>
            {/* Shipping Mode */}
            <div className="form-group">
              <label className="form-label">Shipping Mode</label>
              <select className="form-control" value={form.shipping_mode} onChange={set("shipping_mode")}>
                {FIELD_OPTS.shipping_mode.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            {/* Distance */}
            <div className="form-group">
              <label className="form-label">Distance (km)</label>
              <input
                className="form-control"
                type="number"
                min="1" max="5000"
                value={form.distance_km}
                onChange={set("distance_km")}
                placeholder="e.g. 350"
              />
            </div>

            {/* Weather */}
            <div className="form-group">
              <label className="form-label">Weather Condition</label>
              <select className="form-control" value={form.weather_condition} onChange={set("weather_condition")}>
                {FIELD_OPTS.weather_condition.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            {/* Traffic */}
            <div className="form-group">
              <label className="form-label">Traffic Level</label>
              <select className="form-control" value={form.traffic_level} onChange={set("traffic_level")}>
                {FIELD_OPTS.traffic_level.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            {/* Order Priority */}
            <div className="form-group">
              <label className="form-label">Order Priority</label>
              <select className="form-control" value={form.order_priority} onChange={set("order_priority")}>
                {FIELD_OPTS.order_priority.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            {/* Warehouse */}
            <div className="form-group">
              <label className="form-label">Warehouse Location</label>
              <input
                className="form-control"
                value={form.warehouse_location}
                onChange={set("warehouse_location")}
                placeholder="e.g. Mumbai"
              />
            </div>

            {/* Delivery */}
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Delivery Location</label>
              <input
                className="form-control"
                value={form.delivery_location}
                onChange={set("delivery_location")}
                placeholder="e.g. Bangalore"
              />
            </div>
          </div>

          {/* Input summary chips */}
          <div style={S.chips}>
            {[
              { label: "Mode",     val: form.shipping_mode },
              { label: "Weather",  val: form.weather_condition },
              { label: "Traffic",  val: form.traffic_level },
              { label: "Priority", val: form.order_priority },
              { label: "Distance", val: `${form.distance_km} km` },
            ].map(({ label, val }) => (
              <div key={label} style={S.chip}>
                <span style={S.chipLabel}>{label}</span>
                <span style={S.chipVal}>{val}</span>
              </div>
            ))}
          </div>

          {/* Submit */}
          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={handleSubmit}
            disabled={loading}
            style={{ marginTop: 20 }}
          >
            {loading
              ? <><span className="spinner" /> Analyzing shipment...</>
              : <><Send size={16} /> Run Prediction</>}
          </button>
        </div>

        {/* ── Result ──────────────────────────────────────────────────────── */}
        <div>
          {!result && !loading && (
            <div style={S.placeholder}>
              <div style={S.placeholderIcon}>🔮</div>
              <div style={S.placeholderTitle}>Awaiting Prediction</div>
              <div style={S.placeholderText}>
                Fill in the shipment details and click "Run Prediction" to see
                the delay forecast, risk score, and AI-generated suggestions.
              </div>
            </div>
          )}
          {loading && (
            <div style={S.placeholder}>
              <div style={{ margin: "0 auto 16px", width: 40, height: 40, borderRadius: "50%",
                border: "3px solid #2a3550", borderTopColor: "#00e5ff",
                animation: "spin 0.7s linear infinite" }} />
              <div style={S.placeholderTitle}>Running ML Model...</div>
              <div style={S.placeholderText}>XGBoost is analyzing all risk factors</div>
            </div>
          )}
          {result && <ResultCard result={result} />}
        </div>
      </div>

      {/* Chatbot */}
      <Chatbot lastPredictionId={result?.id} />
    </div>
  );
}

const S = {
  titleRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12,
  },
  title: { fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: "#e8edf5" },
  subtitle: { color: "#8fa3c8", fontSize: 13, marginTop: 4, fontFamily: "'IBM Plex Mono',monospace" },
  layout: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start",
    "@media(max-width:768px)": { gridTemplateColumns: "1fr" } },
  sectionTitle: {
    fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 600,
    color: "#4a5a7a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20,
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  chips: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 },
  chip: {
    display: "flex", alignItems: "center", gap: 6,
    background: "rgba(0,229,255,0.05)", border: "1px solid rgba(0,229,255,0.1)",
    borderRadius: 8, padding: "4px 10px",
  },
  chipLabel: { fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#4a5a7a", textTransform: "uppercase" },
  chipVal:   { fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#00e5ff", fontWeight: 600 },
  placeholder: {
    border: "2px dashed #2a3550", borderRadius: 16, padding: "60px 32px",
    textAlign: "center", color: "#4a5a7a",
  },
  placeholderIcon: { fontSize: 40, marginBottom: 16 },
  placeholderTitle: { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, color: "#8fa3c8", marginBottom: 8 },
  placeholderText: { fontSize: 13, lineHeight: 1.6, maxWidth: 300, margin: "0 auto" },
};
