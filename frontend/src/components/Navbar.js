import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Truck, LogOut, Cpu } from "lucide-react";

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <nav style={styles.nav}>
      {/* Logo */}
      <div style={styles.logo}>
        <Cpu size={20} color="#00e5ff" />
        <span style={styles.logoText}>
          Logi<span style={{ color: "#00e5ff" }}>Predict</span>
          <span style={styles.logoAi}> AI</span>
        </span>
      </div>

      {/* Links */}
      <div style={styles.links}>
        <NavLink
          to="/predict"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.linkActive : {}),
          })}
        >
          <Truck size={15} />
          Predict
        </NavLink>
        <NavLink
          to="/dashboard"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.linkActive : {}),
          })}
        >
          <LayoutDashboard size={15} />
          Dashboard
        </NavLink>
      </div>

      {/* User + Logout */}
      <div style={styles.right}>
        <span style={styles.username}>
          <span style={styles.dot} />
          {user?.username}
        </span>
        <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
          <LogOut size={15} />
        </button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    height: "58px",
    background: "rgba(18, 24, 40, 0.95)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #2a3550",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoText: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 18,
    color: "#e8edf5",
    letterSpacing: "-0.02em",
  },
  logoAi: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    color: "#00ff88",
    fontWeight: 600,
  },
  links: { display: "flex", gap: 4 },
  link: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    borderRadius: 8,
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 13,
    fontWeight: 500,
    color: "#8fa3c8",
    textDecoration: "none",
    transition: "all 0.2s",
  },
  linkActive: {
    background: "rgba(0, 229, 255, 0.1)",
    color: "#00e5ff",
    border: "1px solid rgba(0, 229, 255, 0.2)",
  },
  right: { display: "flex", alignItems: "center", gap: 12 },
  username: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    color: "#8fa3c8",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#00ff88",
    boxShadow: "0 0 8px #00ff88",
    animation: "pulse-dot 2s ease-in-out infinite",
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid #2a3550",
    borderRadius: 8,
    padding: "6px 8px",
    color: "#8fa3c8",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    transition: "all 0.2s",
  },
};
