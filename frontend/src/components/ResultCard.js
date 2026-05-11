import React from "react";
import {
  AlertTriangle, CheckCircle, TrendingUp,
  MapPin, Lightbulb, ChevronRight
} from "lucide-react";

const RISK_COLORS = {
  Low:      { color: "#00ff88", bg: "rgba(0,255,136,0.08)",  border: "rgba(0,255,136,0.2)"  },
  Medium:   { color: "#ffd166", bg: "rgba(255,209,102,0.08)", border: "rgba(255,209,102,0.2)" },
  High:     { color: "#ff6b35", bg: "rgba(255,107,53,0.08)",  border: "rgba(255,107,53,0.2)"  },
  Critical: { color: "#ff4d6d", bg: "rgba(255,77,109,0.08)",  border: "rgba(255,77,109,0.2)"  },
};

export default function ResultCard({ result }) {
  if (!result) return null;

  const risk   = result.risk_level || "Medium";
  const colors = RISK_COLORS[risk] || RISK_COLORS.Medium;
  const pct    = Math.round(result.probability_score * 100);
  const delayed = result.predicted_delay;

  const reasons     = (result.reason_for_delay || "").split(" | ").filter(Boolean);
  const suggestions = (result.mitigation_suggestions || "").split(" | ").filter(Boolean);

  return (
    <div
      className="card animate-fade-in-up"
      style={{ border: `1px solid ${colors.border}`, background: colors.bg, marginTop: 24 }}
    >
      {/* Header */}
      <div style={S.header}>
        <div style={S.statusBlock}>
          {delayed ? (
            <AlertTriangle size={28} color="#ff4d6d" />
          ) : (
            <CheckCircle size={28} color="#00ff88" />
          )}
          <div>
            <div style={S.verdict(delayed)}>
              {delayed ? "⚠ Delay Predicted" : "✓ On Time"}
            </div>
            <div style={S.subtext}>ML Prediction Result</div>
          </div>
        </div>

        <div style={S.scoreBlock}>
          <div style={S.scoreLabel}>Risk Score</div>
          <div style={{ ...S.scoreValue, color: colors.color }}>{pct}%</div>
          <div style={{ ...S.riskBadge, color: colors.color, borderColor: colors.border }}>
            {risk} Risk
          </div>
        </div>
      </div>

      {/* Risk Meter */}
      <div style={{ marginBottom: 20 }}>
        <div style={S.meterLabel}>
          <span>Delay Probability</span>
          <span style={{ color: colors.color, fontFamily: "'IBM Plex Mono', monospace" }}>{pct}%</span>
        </div>
        <div className="risk-bar">
          <div
            className="risk-fill"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${colors.color}88, ${colors.color})`,
            }}
          />
        </div>
      </div>

      {/* Reasons */}
      {reasons.length > 0 && (
        <div style={S.section}>
          <div style={S.sectionTitle}>
            <TrendingUp size={14} color="#ff6b35" />
            Delay Factors Detected
          </div>
          <ul style={S.list}>
            {reasons.map((r, i) => (
              <li key={i} style={S.listItem}>
                <ChevronRight size={12} color="#ff6b35" style={{ flexShrink: 0, marginTop: 2 }} />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div style={{ ...S.section, marginBottom: 0 }}>
          <div style={S.sectionTitle}>
            <Lightbulb size={14} color="#00e5ff" />
            Mitigation Suggestions
          </div>
          <ul style={S.list}>
            {suggestions.map((s, i) => (
              <li key={i} style={{ ...S.listItem, color: "#8fa3c8" }}>
                <ChevronRight size={12} color="#00e5ff" style={{ flexShrink: 0, marginTop: 2 }} />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Prediction ID footer */}
      <div style={S.footer}>
        <MapPin size={11} />
        Prediction #{result.id} &nbsp;·&nbsp;
        {new Date(result.timestamp).toLocaleString()}
      </div>
    </div>
  );
}

const S = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  statusBlock: { display: "flex", alignItems: "center", gap: 12 },
  verdict: (d) => ({
    fontFamily: "'Syne', sans-serif",
    fontSize: 20,
    fontWeight: 700,
    color: d ? "#ff4d6d" : "#00ff88",
  }),
  subtext: { fontSize: 11, color: "#4a5a7a", fontFamily: "'IBM Plex Mono', monospace" },
  scoreBlock: { textAlign: "right" },
  scoreLabel: { fontSize: 10, color: "#4a5a7a", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase" },
  scoreValue: { fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, lineHeight: 1 },
  riskBadge: {
    display: "inline-block",
    border: "1px solid",
    borderRadius: 12,
    padding: "2px 10px",
    fontSize: 10,
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginTop: 4,
  },
  meterLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
    color: "#4a5a7a",
    fontFamily: "'IBM Plex Mono', monospace",
    marginBottom: 6,
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 600,
    color: "#8fa3c8",
    fontFamily: "'IBM Plex Mono', monospace",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 8,
  },
  list: { listStyle: "none", display: "flex", flexDirection: "column", gap: 6 },
  listItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 6,
    fontSize: 13,
    color: "#8fa3c8",
    lineHeight: 1.5,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginTop: 16,
    paddingTop: 12,
    borderTop: "1px solid rgba(42, 53, 80, 0.5)",
    fontSize: 11,
    color: "#4a5a7a",
    fontFamily: "'IBM Plex Mono', monospace",
  },
};
