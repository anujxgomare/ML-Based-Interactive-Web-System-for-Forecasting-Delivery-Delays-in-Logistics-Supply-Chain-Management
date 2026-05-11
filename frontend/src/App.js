import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import PredictionPage from "./pages/PredictionPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("lp_user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("lp_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("lp_user");
    localStorage.removeItem("lp_token");
  };

  return (
    <BrowserRouter>
      <div className="app">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a1f2e",
              color: "#e2e8f0",
              border: "1px solid #2d3748",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "13px",
            },
          }}
        />
        {user && <Navbar user={user} onLogout={handleLogout} />}
        <Routes>
          <Route
            path="/login"
            element={!user ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/predict" />}
          />
          <Route
            path="/predict"
            element={user ? <PredictionPage user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard"
            element={user ? <DashboardPage /> : <Navigate to="/login" />}
          />
          <Route path="*" element={<Navigate to={user ? "/predict" : "/login"} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
