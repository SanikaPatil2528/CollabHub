import React, { useState, useEffect, useRef } from "react";
import { commentService } from "../services/commentService.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function TaskCommentsModal({ task, projectId, onClose }) {
  const { user: currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const threadBottomRef = useRef(null);

  // Fetch comments specific to this taskId on mount
  const loadTaskComments = async () => {
    if (!task?._id) return;
    try {
      setLoading(true);
      setError("");
      const data = await commentService.getTaskComments(task._id);
      setComments(data);
    } catch (err) {
      setError(err.message || "Failed to load thread.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaskComments();
  }, [task?._id]);

  // Keep the latest comments in view
  useEffect(() => {
    threadBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      // Passes projectId, message content, and target taskId
      const freshComment = await commentService.createComment(projectId, replyText.trim(), task._id);
      setComments((prev) => [...prev, freshComment]);
      setReplyText("");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveComment = async (commentId) => {
    if (!window.confirm("Delete this comment from the task thread?")) return;
    try {
      await commentService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div style={styles.modalHeader}>
          <div>
            <span style={styles.metaLabel}>Task Discussion Thread</span>
            <h3 style={styles.modalTitle}>{task.title}</h3>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Modal Body */}
        <div style={styles.modalBody}>
          <div style={styles.taskMetaBlock}>
            <p style={styles.metaText}><strong>Status:</strong> {task.status || "To-Do"}</p>
            <p style={styles.metaText}><strong>Priority:</strong> {task.priority || "low"}</p>
            <p style={styles.descContent}><strong>Description:</strong> {task.description || "No task details provided."}</p>
          </div>

          <h4 style={styles.threadTitle}>Discussion History</h4>
          
          {error && <div style={styles.errorText}>⚠️ {error}</div>}

          {/* Comments Stream Box */}
          <div style={styles.threadContainer}>
            {loading ? (
              <div style={styles.centerText}>Syncing task updates...</div>
            ) : comments.length === 0 ? (
              <div style={styles.centerText}>No comments posted on this task yet.</div>
            ) : (
              comments.map((c) => {
                const isAuthor = c.author?._id === currentUser?._id;
                return (
                  <div key={c._id} style={styles.commentRow}>
                    <div style={styles.cHeader}>
                      <span style={styles.cUser}>@{c.author?.username || "user"}</span>
                      {isAuthor && (
                        <button onClick={() => handleRemoveComment(c._id)} style={styles.cTrash}>
                          ✕ Delete
                        </button>
                      )}
                    </div>
                    <p style={styles.cContent}>{c.content}</p>
                  </div>
                );
              })
            )}
            <div ref={threadBottomRef} />
          </div>
        </div>

        {/* Reply Box Dock */}
        <form onSubmit={handlePostComment} style={styles.replyForm}>
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Post a progress update or note..."
            style={styles.replyInput}
          />
          <button type="submit" style={styles.submitBtn}>Comment</button>
        </form>

      </div>
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" },
  modalCard: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px", width: "100%", maxWidth: "550px", display: "flex", flexDirection: "column", maxHeight: "80vh", overflow: "hidden" },
  modalHeader: { padding: "16px 20px", borderBottom: "1px solid #334155", backgroundColor: "#0f172a", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  metaLabel: { color: "#38bdf8", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase" },
  modalTitle: { margin: "4px 0 0 0", color: "#fff", fontSize: "16px", fontWeight: "600" },
  closeBtn: { background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px" },
  modalBody: { padding: "20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "16px" },
  taskMetaBlock: { backgroundColor: "#0f172a", border: "1px solid #334155", padding: "12px", borderRadius: "8px" },
  metaText: { margin: "0 0 4px 0", fontSize: "12px", color: "#94a3b8" },
  descContent: { margin: "6px 0 0 0", fontSize: "13px", color: "#cbd5e1", borderTop: "1px solid #1e293b", paddingTop: "6px" },
  threadTitle: { margin: 0, fontSize: "13px", color: "#fff", fontWeight: "600" },
  threadContainer: { display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", minHeight: "150px" },
  commentRow: { backgroundColor: "#0f172a80", border: "1px solid #334155", padding: "10px", borderRadius: "8px" },
  cHeader: { display: "flex", justifyContent: "space-between", marginBottom: "4px" },
  cUser: { color: "#10b981", fontSize: "12px", fontWeight: "bold" },
  cTrash: { background: "none", border: "none", color: "#ef4444", fontSize: "11px", cursor: "pointer", padding: 0 },
  cContent: { margin: 0, color: "#cbd5e1", fontSize: "13px", lineHeight: "1.4", wordBreak: "break-word" },
  centerText: { textAlign: "center", color: "#475569", padding: "20px 0", fontSize: "12px" },
  errorText: { color: "#fca5a5", fontSize: "12px", padding: "6px 12px", backgroundColor: "#991b1b33", borderRadius: "4px" },
  replyForm: { padding: "12px 20px", borderTop: "1px solid #334155", backgroundColor: "#0f172a", display: "flex", gap: "10px" },
  replyInput: { flex: 1, backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "6px", padding: "8px 12px", color: "#fff", fontSize: "13px" },
  submitBtn: { backgroundColor: "#10b981", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }
};