import React, { useState } from "react";
import { login, signup } from "../services/api";
import toast from "react-hot-toast";
import { Cpu, Eye, EyeOff } from "lucide-react";

export default function LoginPage({ onLogin }) {
  const [mode, setMode]       = useState("login"); // "login" | "signup"
  const [form, setForm]       = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  // ── Extract a clean string message from any axios/API error ──────────────
  const getErrorMessage = (err) => {
    const data = err?.response?.data;
    if (!data) return "Something went wrong. Is the backend running?";

    // FastAPI validation error → { detail: [ {msg, loc, ...} ] }
    if (Array.isArray(data.detail)) {
      return data.detail.map((e) => e.msg || JSON.stringify(e)).join(", ");
    }
    // FastAPI HTTP exception → { detail: "string" }
    if (typeof data.detail === "string") return data.detail;
    // Fallback
    return JSON.stringify(data);
  };

  const handleSubmit = async () => {
    if (!form.username.trim()) return toast.error("Username is required");
    if (!form.password)        return toast.error("Password is required");
    if (mode === "signup" && form.password.length < 6)
      return toast.error("Password must be at least 6 characters");

    setLoading(true);
    try {
      const res =
        mode === "login"
          ? await login({ username: form.username, password: form.password })
          : await signup({ username: form.username, password: form.password });

      localStorage.setItem("lp_token", res.access_token);
      onLogin({ username: res.username, token: res.access_token });
      toast.success(`Welcome, ${res.username}!`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.glow1} />
      <div style={S.glow2} />

      <div style={S.card} className="animate-fade-in-up">
        {/* Logo */}
        <div style={S.logoRow}>
          <Cpu size={32} color="#00e5ff" />
          <div>
            <div style={S.logoText}>
              Logi<span style={{ color: "#00e5ff" }}>Predict</span>
              <span style={S.logoAi}> AI</span>
            </div>
            <div style={S.logoSub}>Delivery Delay Forecasting System</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          {["login", "signup"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setForm({ username: "", password: "" }); }}
              style={{ ...S.tab, ...(mode === m ? S.tabActive : {}) }}
            >
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={S.form}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-control"
              placeholder="your_username"
              value={form.username}
              onChange={set("username")}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                className="form-control"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={set("password")}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                style={{ paddingRight: 40 }}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                onClick={() => setShowPw((v) => !v)}
                style={S.eyeBtn}
                tabIndex={-1}
                type="button"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={handleSubmit}
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? <span className="spinner" /> : null}
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>

          {/* Demo hint */}
          <div style={S.hint}>
            {mode === "login" ? (
              <>
                First time? Run the seed script or{" "}
                <span
                  style={{ color: "#00e5ff", cursor: "pointer" }}
                  onClick={() => setMode("signup")}
                >
                  create an account
                </span>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <span
                  style={{ color: "#00e5ff", cursor: "pointer" }}
                  onClick={() => setMode("login")}
                >
                  Sign in
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", padding: 24, position: "relative", overflow: "hidden",
  },
  glow1: {
    position: "absolute", width: 500, height: 500, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,180,204,0.08) 0%, transparent 70%)",
    top: "20%", left: "30%", transform: "translate(-50%,-50%)", pointerEvents: "none",
  },
  glow2: {
    position: "absolute", width: 400, height: 400, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,255,136,0.05) 0%, transparent 70%)",
    bottom: "20%", right: "25%", pointerEvents: "none",
  },
  card: {
    background: "#121828", border: "1px solid #2a3550", borderRadius: 20,
    padding: "40px 36px", width: "100%", maxWidth: 420,
    boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,229,255,0.06)",
    position: "relative", zIndex: 1,
  },
  logoRow: { display: "flex", alignItems: "center", gap: 14, marginBottom: 32 },
  logoText: {
    fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24,
    color: "#e8edf5", letterSpacing: "-0.02em",
  },
  logoAi: { fontFamily: "'IBM Plex Mono',monospace", fontSize: 14, color: "#00ff88", fontWeight: 600 },
  logoSub: { fontSize: 11, color: "#4a5a7a", fontFamily: "'IBM Plex Mono',monospace", marginTop: 2 },
  tabs: {
    display: "flex", gap: 4, marginBottom: 28,
    background: "#0b0f1a", borderRadius: 12, padding: 4,
  },
  tab: {
    flex: 1, padding: "8px 16px", borderRadius: 9, border: "none",
    fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 500,
    color: "#4a5a7a", cursor: "pointer", background: "transparent", transition: "all 0.2s",
  },
  tabActive: {
    background: "#1a2235", color: "#00e5ff", border: "1px solid rgba(0,229,255,0.2)",
  },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  eyeBtn: {
    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
    background: "transparent", border: "none", color: "#4a5a7a",
    cursor: "pointer", display: "flex", alignItems: "center",
  },
  hint: {
    textAlign: "center", fontSize: 12, color: "#4a5a7a",
    fontFamily: "'IBM Plex Mono',monospace", marginTop: 4,
  },
};