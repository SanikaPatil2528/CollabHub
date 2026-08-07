import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { notificationService } from "../api/notificationService.js";
import { inviteService } from "../api/inviteService.js";

export default function GlobalNavbar(){
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Notification and Dropdown States
    const [notifications, setNotifications] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Calculate unread badge count dynamically
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // 1. Fetch user notifications on navbar mount
    const fetchNotifications = async () => {
        try {
        const data = await notificationService.getUserNotifications();
        setNotifications(data);
        } catch (err) {
        console.error("Error collecting inbox updates:", err.message);
        }
    };

    useEffect(() => {
        if (user) {
        fetchNotifications();
        // Polling interval every 30 seconds for live updates
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
        }
    }, [user]);

    // 2. Mark a single notification read
    const handleMarkAsRead = async (id, e) => {
        e.stopPropagation(); // Avoid triggering card links
        try {
        await notificationService.markNotificationAsRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        } catch (err) {
        console.error(err.message);
        }
    };

    // 3. Clear all unread items at once
    const handleClearAll = async () => {
        try {
        await notificationService.markAllNotificationsAsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (err) {
        console.error(err.message);
        }
    };

    // 4. Handle accepting/declining invites from the dropdown directly
    const handleInviteAction = async (notification, action) => {
        try {
        // Find the invitation ID by cross-checking pending items if your system routes it
        // For this workflow, if we accept an invite, we route directly to our profile tab or handle it safely:
        if (notification.project) {
            // If your backend handles response via inviteService, we can redirect or trigger a refresh
            // For absolute safety, click notifications redirect them directly to the action center
            setIsDropdownOpen(false);
            if (notification.type === "PROJECT_INVITE") {
            navigate("/"); // Take them to profile dashboard where the invite action buttons live!
            } else {
            navigate(`/projects/${notification.project._id || notification.project}`);
            }
        }
        } catch (err) {
        console.error(err.message);
        }
    };

    return (
    <nav style={styles.navbar}>
      <div style={styles.navLeft}>
        <Link to="/workspaces" style={styles.brandTitle}>🚀 CollabHub</Link>
        <div style={styles.navLinks}>
          <Link to="/" style={styles.link}>My Profile</Link>
          <Link to="/workspaces" style={styles.link}>Workspaces</Link>
        </div>
      </div>

      <div style={styles.navRight}>
        {/* Notification Bell Area */}
        <div style={styles.bellContainer} ref={dropdownRef}>
          <button 
            style={styles.bellButton} 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            🔔 
            {unreadCount > 0 && (
              <span style={styles.badge}>{unreadCount}</span>
            )}
          </button>

          {/* Alert Flyout Dropdown */}
          {isDropdownOpen && (
            <div style={styles.dropdownPanel}>
              <div style={styles.dropdownHeader}>
                <span style={{ fontWeight: "bold" }}>System Actions Inbox</span>
                {unreadCount > 0 && (
                  <button onClick={handleClearAll} style={styles.clearAllBtn}>
                    Clear All
                  </button>
                )}
              </div>
              
              <div style={styles.dropdownList}>
                {notifications.length === 0 ? (
                  <div style={styles.emptyText}>Your inbox is completely empty.</div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif._id} 
                      style={{
                        ...styles.notifCard,
                        backgroundColor: notif.isRead ? "#fff" : "#f5f7ff"
                      }}
                      onClick={() => {
                        setIsDropdownOpen(false);
                        if (notif.project) navigate(`/projects/${notif.project._id || notif.project}`);
                      }}
                    >
                      <div style={styles.notifContent}>
                        <p style={styles.notifMessage}>{notif.message}</p>
                        <span style={styles.notifTime}>
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {!notif.isRead && (
                        <button 
                          onClick={(e) => handleMarkAsRead(notif._id, e)}
                          style={styles.readCheckBtn}
                          title="Mark Read"
                        >
                          ✓
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Session Presentation */}
        {user && (
          <div style={styles.userSession}>
            <img 
              src={user.avatar || "https://via.placeholder.com/40"} 
              alt="Avatar" 
              style={styles.avatarThumbnail}
              onClick={() => navigate("/")}
            />
            <span style={styles.username}>@{user.username}</span>
            <button onClick={logout} style={styles.logoutBtn}>Logout</button>
          </div>
        )}
      </div>
    </nav>
  );

}


// Simple Inline Layout Architectures
const styles = {

  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e1e2f",
    color: "#fff",
    padding: "10px 30px",
    height: "60px",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },

  navLeft: { display: "flex", alignItems: "center", gap: "30px" },
  brandTitle: { color: "#4f46e5", fontSize: "22px", fontWeight: "bold", textDecoration: "none" },
  navLinks: { display: "flex", gap: "20px" },
  link: { color: "#cbd5e1", textDecoration: "none", fontSize: "15px", fontWeight: "500" },
  navRight: { display: "flex", alignItems: "center", gap: "25px" },
  bellContainer: { position: "relative" },
  bellButton: { background: "none", border: "none", fontSize: "22px", cursor: "pointer", position: "relative" },

  badge: {
    position: "absolute",
    top: "-5px",
    right: "-5px",
    backgroundColor: "#ef4444",
    color: "#fff",
    borderRadius: "50%",
    padding: "2px 6px",
    fontSize: "11px",
    fontWeight: "bold",
  },

  dropdownPanel: {
    position: "absolute",
    right: 0,
    top: "40px",
    backgroundColor: "#fff",
    color: "#333",
    width: "350px",
    maxHeight: "450px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  dropdownHeader: {
    padding: "12px 16px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },

  clearAllBtn: { background: "none", border: "none", color: "#4f46e5", cursor: "pointer", fontSize: "13px" },
  dropdownList: { overflowY: "auto", flexGrow: 1 },
  emptyText: { padding: "20px", textAlign: "center", color: "#64748b", fontSize: "14px" },

  notifCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    transition: "background 0.2s",
  },

  notifContent: { flexGrow: 1, paddingRight: "10px" },
  notifMessage: { fontSize: "13px", margin: "0 0 4px 0", color: "#1e293b", lineHeight: "1.4" },
  notifTime: { fontSize: "11px", color: "#94a3b8" },

  readCheckBtn: {
    backgroundColor: "#e2e8f0",
    border: "none",
    borderRadius: "4px",
    width: "22px",
    height: "22px",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#475569",
  },

  userSession: { display: "flex", alignItems: "center", gap: "12px" },
  avatarThumbnail: { width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", objectFit: "cover", border: "2px solid #4f46e5" },
  username: { color: "#e2e8f0", fontSize: "14px", fontWeight: "500" },
  logoutBtn: { backgroundColor: "#ef4444", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "13px" },

};