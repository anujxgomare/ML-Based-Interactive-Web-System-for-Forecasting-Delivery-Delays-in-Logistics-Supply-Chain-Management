/**
 * api.js – Centralized API service using axios.
 * All backend calls go through here.
 */

import axios from "axios";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: BASE,
  timeout: 30000,
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Predictions ───────────────────────────────────────────────────────────────
export const runPrediction = (data) =>
  api.post("/predict", data).then((r) => r.data);

export const fetchPredictions = (skip = 0, limit = 50) =>
  api.get("/predictions", { params: { skip, limit } }).then((r) => r.data);

export const fetchPrediction = (id) =>
  api.get(`/predictions/${id}`).then((r) => r.data);

export const fetchStats = () =>
  api.get("/stats").then((r) => r.data);

export const exportCSV = () => {
  const token = localStorage.getItem("lp_token");
  const url   = `${BASE}/export`;
  const a = document.createElement("a");
  a.href = url;
  a.download = "logipredict_export.csv";
  a.click();
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export const sendChatMessage = (message, predictionId = null) =>
  api.post("/chat", { message, prediction_id: predictionId }).then((r) => r.data);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const signup = (data) =>
  api.post("/auth/signup", data).then((r) => r.data);

export const login = (data) =>
  api.post("/auth/login", data).then((r) => r.data);

export default api;
