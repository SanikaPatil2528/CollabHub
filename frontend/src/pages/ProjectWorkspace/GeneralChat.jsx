import React, { useState, useEffect, useRef } from "react";
import { commentService } from "../services/commentService.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function GeneralChat({ projectId }) {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const chatBottomRef = useRef(null);

  // 1. Fetch project-wide messages on load
  const loadChatFeed = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError("");
      const feed = await commentService.getProjectComments(projectId);
      setMessages(feed);
    } catch (err) {
      setError(err.message || "Failed to load project chat room.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChatFeed();
  }, [projectId]);

  // Keep scroll view locked to the latest incoming messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 2. Dispatch a general text message (taskId is omitted/null)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const freshComment = await commentService.createComment(projectId, text.trim());
      setMessages((prev) => [...prev, freshComment]);
      setText("");
    } catch (err) {
      alert(err.message);
    }
  };

  // 3. Remove message (allowed if author or project owner)
  const handleDeleteMessage = async (commentId) => {
    if (!window.confirm("Remove this comment from the project workspace feed?")) return;
    try {
      await commentService.deleteComment(commentId);
      setMessages((prev) => prev.filter((msg) => msg._id !== commentId));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={styles.chatWrapper}>
      {/* Chat Title Panel */}
      <div style={styles.chatHeader}>
        <h3 style={styles.chatTitle}>💬 General Project Chat</h3>
        <p style={styles.chatSubtitle}>Instant workspace communication feed for all team members</p>
      </div>

      {error && <div style={styles.errorText}>⚠️ {error}</div>}

      {/* Messages Timeline Stack */}
      <div style={styles.messageStack}>
        {loading ? (
          <div style={styles.statusText}>Connecting to message board stream...</div>
        ) : messages.length === 0 ? (
          <div style={styles.emptyText}>No feed history logged. Drop a line to align the team!</div>
        ) : (
          messages.map((msg) => {
            const isMyComment = msg.author?._id === currentUser?._id;
            return (
              <div key={msg._id} style={styles.msgCard}>
                <div style={styles.authorArea}>
                  <span style={styles.authorName}>@{msg.author?.username || "user"}</span>
                  <span style={styles.timeLabel}>
                    {msg.createdAt 
                      ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                      : ""}
                  </span>
                </div>
                <div style={styles.bodyRow}>
                  <p style={styles.msgText}>{msg.content}</p>
                  {isMyComment && (
                    <button onClick={() => handleDeleteMessage(msg._id)} style={styles.trashBtn} title="Delete message">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Form Dock */}
      <form onSubmit={handleSendMessage} style={styles.inputArea}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a general project message..."
          style={styles.chatInput}
        />
        <button type="submit" style={styles.sendBtn}>Send</button>
      </form>
    </div>
  );
}

const styles = {
  chatWrapper: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px", display: "flex", flexDirection: "column", height: "500px", overflow: "hidden", width: "100%", boxSizing: "border-box" },
  chatHeader: { padding: "16px", borderBottom: "1px solid #334155", backgroundColor: "#0f172a" },
  chatTitle: { margin: "0 0 2px 0", color: "#fff", fontSize: "16px", fontWeight: "600" },
  chatSubtitle: { margin: 0, color: "#64748b", fontSize: "12px" },
  messageStack: { flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" },
  msgCard: { backgroundColor: "#0f172a", borderRadius: "8px", border: "1px solid #334155", padding: "10px 12px" },
  authorArea: { display: "flex", justifyContent: "space-between", marginBottom: "4px" },
  authorName: { color: "#38bdf8", fontSize: "12px", fontWeight: "bold" },
  timeLabel: { color: "#475569", fontSize: "10px" },
  bodyRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" },
  msgText: { margin: 0, color: "#cbd5e1", fontSize: "13px", lineHeight: "1.4", wordBreak: "break-word" },
  trashBtn: { background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px", padding: 0, opacity: 0.7 },
  inputArea: { display: "flex", gap: "8px", padding: "12px", borderTop: "1px solid #334155", backgroundColor: "#0f172a" },
  chatInput: { flex: 1, backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "6px", padding: "8px 12px", color: "#fff", fontSize: "13px", outline: "none" },
  sendBtn: { backgroundColor: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "6px", padding: "8px 16px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" },
  errorText: { color: "#fca5a5", fontSize: "12px", padding: "8px 16px", backgroundColor: "#991b1b33", margin: 0 },
  statusText: { color: "#64748b", textAlign: "center", fontSize: "12px", margin: "auto 0" },
  emptyText: { color: "#475569", textAlign: "center", fontSize: "12px", margin: "auto 0", padding: "0 20px" }
};