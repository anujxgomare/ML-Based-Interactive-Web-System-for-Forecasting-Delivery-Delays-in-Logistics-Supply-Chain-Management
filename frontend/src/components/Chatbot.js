import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Bot, User, Minimize2 } from "lucide-react";
import { sendChatMessage } from "../services/api";

const QUICK_PROMPTS = [
  "Why was my delivery delayed?",
  "How can I reduce delay risk?",
  "What factor affected it most?",
  "Suggest a better shipping mode",
];

export default function Chatbot({ lastPredictionId }) {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I'm your LogiPredict AI Assistant 🤖\n\nI can explain delay predictions, analyze risk factors, and suggest improvements. Run a prediction first, then ask me anything!",
    },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChatMessage(msg, lastPredictionId);
      setMessages((prev) => [...prev, { role: "assistant", text: res.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, I couldn't reach the server. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button onClick={() => setOpen(true)} style={S.fab}>
          <MessageCircle size={22} />
          <span style={S.fabLabel}>AI Chat</span>
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div style={S.window} className="animate-fade-in-up">
          {/* Header */}
          <div style={S.header}>
            <div style={S.headerLeft}>
              <div style={S.botAvatar}><Bot size={16} /></div>
              <div>
                <div style={S.headerTitle}>LogiPredict Assistant</div>
                <div style={S.headerSub}>
                  <span style={S.onlineDot} /> Gemini AI · Always on
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={S.closeBtn}>
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div style={S.messages}>
            {messages.map((m, i) => (
              <div key={i} style={m.role === "user" ? S.userRow : S.botRow}>
                {m.role === "assistant" && (
                  <div style={S.smallAvatar}><Bot size={12} /></div>
                )}
                <div style={m.role === "user" ? S.userBubble : S.botBubble}>
                  {m.text.split("\n").map((line, j) => (
                    <span key={j}>{line}{j < m.text.split("\n").length - 1 && <br />}</span>
                  ))}
                </div>
                {m.role === "user" && (
                  <div style={{ ...S.smallAvatar, background: "rgba(0,180,204,0.15)" }}>
                    <User size={12} />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={S.botRow}>
                <div style={S.smallAvatar}><Bot size={12} /></div>
                <div style={S.botBubble}>
                  <span style={S.typingDot} /><span style={{ ...S.typingDot, animationDelay: "0.2s" }} /><span style={{ ...S.typingDot, animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Prompts */}
          <div style={S.quickPrompts}>
            {QUICK_PROMPTS.map((p) => (
              <button key={p} onClick={() => send(p)} style={S.quickBtn} disabled={loading}>
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={S.inputRow}>
            <input
              style={S.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about your delivery..."
              disabled={loading}
            />
            <button onClick={() => send()} style={S.sendBtn} disabled={loading || !input.trim()}>
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const S = {
  fab: {
    position: "fixed", bottom: 28, right: 28,
    display: "flex", alignItems: "center", gap: 8,
    background: "linear-gradient(135deg,#00b4cc,#0077aa)",
    color: "white", border: "none", borderRadius: 28,
    padding: "12px 20px", cursor: "pointer", zIndex: 200,
    fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 600,
    boxShadow: "0 8px 24px rgba(0,180,204,0.4)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  fabLabel: { letterSpacing: "0.03em" },
  window: {
    position: "fixed", bottom: 28, right: 28,
    width: 360, height: 520,
    background: "#121828",
    border: "1px solid #2a3550",
    borderRadius: 16, zIndex: 200,
    display: "flex", flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(0,229,255,0.08)",
    overflow: "hidden",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 16px",
    background: "linear-gradient(135deg,rgba(0,180,204,0.15),rgba(0,119,170,0.1))",
    borderBottom: "1px solid #2a3550",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  botAvatar: {
    width: 34, height: 34, borderRadius: 10,
    background: "rgba(0,229,255,0.15)", border: "1px solid rgba(0,229,255,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center", color: "#00e5ff",
  },
  headerTitle: { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: "#e8edf5" },
  headerSub: { display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#4a5a7a", fontFamily: "'IBM Plex Mono',monospace" },
  onlineDot: { width: 6, height: 6, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 6px #00ff88" },
  closeBtn: {
    background: "transparent", border: "none", color: "#4a5a7a",
    cursor: "pointer", padding: 4, borderRadius: 6, display: "flex",
  },
  messages: { flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 10 },
  userRow: { display: "flex", justifyContent: "flex-end", alignItems: "flex-end", gap: 6 },
  botRow:  { display: "flex", justifyContent: "flex-start", alignItems: "flex-end", gap: 6 },
  smallAvatar: {
    width: 24, height: 24, borderRadius: 8, flexShrink: 0,
    background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center", color: "#00e5ff",
  },
  userBubble: {
    maxWidth: "78%", padding: "8px 12px", borderRadius: "12px 12px 4px 12px",
    background: "linear-gradient(135deg,#00b4cc,#0077aa)",
    color: "white", fontSize: 13, lineHeight: 1.5,
  },
  botBubble: {
    maxWidth: "78%", padding: "8px 12px", borderRadius: "12px 12px 12px 4px",
    background: "#1a2235", border: "1px solid #2a3550",
    color: "#c8d8f0", fontSize: 13, lineHeight: 1.5,
  },
  typingDot: {
    display: "inline-block", width: 6, height: 6,
    borderRadius: "50%", background: "#00e5ff", margin: "0 2px",
    animation: "pulse-dot 1s ease-in-out infinite",
  },
  quickPrompts: {
    padding: "8px 10px", borderTop: "1px solid #2a3550",
    display: "flex", flexWrap: "wrap", gap: 5,
  },
  quickBtn: {
    background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.15)",
    borderRadius: 12, padding: "4px 10px", color: "#8fa3c8",
    fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace",
    transition: "all 0.15s", whiteSpace: "nowrap",
  },
  inputRow: {
    display: "flex", gap: 8, padding: "10px 12px",
    borderTop: "1px solid #2a3550",
  },
  input: {
    flex: 1, background: "#0b0f1a", border: "1px solid #2a3550",
    borderRadius: 10, padding: "8px 12px", color: "#e8edf5",
    fontFamily: "'Inter',sans-serif", fontSize: 13, outline: "none",
  },
  sendBtn: {
    background: "linear-gradient(135deg,#00b4cc,#0077aa)",
    border: "none", borderRadius: 10, padding: "8px 12px",
    color: "white", cursor: "pointer", display: "flex",
    alignItems: "center", transition: "opacity 0.2s",
  },
};
