import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { inviteService } from "../api/inviteService.js";
import GlobalNavbar from "../components/GlobalNavbar.jsx";

export default function Profile() {
  const { user, updateProfile, updateAvatar, deleteAccount, error } = useAuth();
  const navigate = useNavigate();

  // Settings State Managers
  
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [skills, setSkills] = useState(user?.skills?.join(", ") || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Invitations Inbox State Manager
  const [invitations, setInvitations] = useState([]);

  // Fetch incoming project invitations matching the user's email context
  const loadInvitations = async () => {
    try {
      const pendingInvites = await inviteService.getMyPendingInvitations();
      setInvitations(pendingInvites);
    } catch (err) {
      console.error("Failed to gather pending invitations portfolio:", err.message);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  // Handler: Update bio and skills string arrays
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      // Split the comma-separated string into a clean array of skills
      const skillsArray = skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await updateProfile({fullName, bio, skills: skillsArray });
      alert("Profile data records updated successfully!");
    } catch (err) {
      console.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Handler: Secure Cloudinary multipart upload
  const handleAvatarSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("avatarLocalPath", selectedFile);

    try {
      await updateAvatar(formData);
      alert("Avatar updated successfully!");
      setSelectedFile(null);
    } catch (err) {
      console.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Handler: Respond to workspace invitations
  const handleResponse = async (invitationId, action) => {
    try {
      await inviteService.respondToInvitation(invitationId, action);
      alert(`Workspace request successfully ${action.toLowerCase()}!`);
      loadInvitations(); // Reload the remaining invitations
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "WARNING: Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone."
    );
    if (!confirmed) return;

    try {
      await deleteAccount();
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <GlobalNavbar />

      <div style={styles.mainContent}>
        {/* UPPER HERO GRID FRAME */}
        <div style={styles.heroSection}>
          <div style={styles.heroLeft}>
            <img 
              src={user?.avatar || "https://via.placeholder.com/100"} 
              alt="User Avatar" 
              style={styles.largeAvatar} 
            />
            <div>
              <h1 style={styles.profileName}>{user?.fullName || "Collaborator Profile"}</h1>
              <p style={styles.profileUsername}>@{user?.username}</p>
              <p style={styles.profileEmail}>{user?.email}</p>
            </div>
          </div>
          <button onClick={() => navigate("/workspaces")} style={styles.hubGatewayBtn}>
            Go to Workspaces Hub →
          </button>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        {/* TWO COLUMN SIDE-BY-SIDE INTEGRATION */}
        <div style={styles.gridContainer}>
          
          {/* LEFT SIDEBAR: PROFILE DATA & INVITATIONS */}
          <div style={styles.gridColumn}>
            
            {/* Full name, Bio & Skills form fields */}
            <div style={styles.card}>
            <h3 style={styles.cardTitle}>Professional Identity</h3>
            <form onSubmit={handleProfileUpdate} style={styles.verticalForm}>
                
                {/* Full Name Field */}
                <label style={styles.fieldLabel}>Full Name</label>
                <input 
                type="text" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                style={styles.inputField}
                required
                />

                <label style={styles.fieldLabel}>Custom Biography</label>
                <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell your team about yourself, your role interests, or engineering background..."
                style={styles.textArea}
                />

                <label style={styles.fieldLabel}>Core Tech Skills (Comma separated)</label>
                <input 
                type="text" 
                value={skills} 
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, Node.js, MongoDB, Python"
                style={styles.inputField}
                />

                <button type="submit" disabled={savingProfile} style={styles.primarySaveBtn}>
                {savingProfile ? "Saving Details..." : "Save Identity Changes"}
                </button>
            </form>
            </div>

            {/* INVITATIONS HUB ACTION BOX */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📨 Incoming Project Invitations</h3>
              <div style={styles.invitationInbox}>
                {invitations.length === 0 ? (
                  <p style={styles.emptyText}>No pending project invitations at this time.</p>
                ) : (
                  invitations.map((invite) => (
                    <div key={invite._id} style={styles.inviteItem}>
                      <div>
                        <h4 style={styles.inviteTitle}>{invite.project?.title}</h4>
                        <p style={styles.inviteDesc}>{invite.project?.description}</p>
                        <span style={styles.inviteSender}>Invited by: <b>@{invite.inviter?.username}</b></span>
                      </div>
                      <div style={styles.actionButtonGroup}>
                        <button 
                          onClick={() => handleResponse(invite._id, "Accepted")}
                          style={styles.acceptBtn}
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleResponse(invite._id, "Declined")}
                          style={styles.declineBtn}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR: ACCOUNT PICTURE & DANGER SETTINGS */}
          <div style={styles.gridColumn}>
            
            {/* Image management module */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Profile Picture Configuration</h3>
              <form onSubmit={handleAvatarSubmit} style={styles.verticalForm}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  style={styles.fileInput}
                />
                <button 
                  type="submit" 
                  disabled={!selectedFile || uploading}
                  style={{ ...styles.primarySaveBtn, opacity: (!selectedFile || uploading) ? 0.5 : 1 }}
                >
                  {uploading ? "Uploading file stream..." : "Save Avatar Image"}
                </button>
              </form>
            </div>

            {/* Danger Zone resource teardown parameters */}
            <div style={styles.dangerCard}>
              <h3 style={styles.dangerTitle}>Danger Zone</h3>
              <p style={styles.dangerText}>
                Once you delete your account, there is no going back. All of your personal workspace histories and comments will be erased.
              </p>
              <button onClick={handleDeleteAccount} style={styles.deleteAccountBtn}>
                Permanently Terminate Account
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}


// Global UI Component Stylesheet
const styles = {
  pageContainer: { minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc" },
  mainContent: { padding: "30px", maxWidth: "1200px", margin: "0 auto" },
  heroSection: { display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1e293b", padding: "24px", borderRadius: "8px", marginBottom: "30px", border: "1px solid #334155" },
  heroLeft: { display: "flex", alignItems: "center", gap: "20px" },
  largeAvatar: { width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "3px solid #4f46e5" },
  profileName: { fontSize: "24px", margin: "0 0 4px 0", color: "#fff" },
  profileUsername: { fontSize: "15px", margin: "0 0 4px 0", color: "#38bdf8", fontWeight: "500" },
  profileEmail: { fontSize: "14px", margin: 0, color: "#94a3b8" },
  hubGatewayBtn: { backgroundColor: "#4f46e5", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "15px", transition: "background 0.2s" },
  errorBanner: { padding: "14px", backgroundColor: "#7f1d1d", color: "#fca5a5", borderRadius: "6px", marginBottom: "20px", fontWeight: "500" },
  gridContainer: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" },
  gridColumn: { display: "flex", flexDirection: "column", gap: "30px" },
  card: { backgroundColor: "#1e293b", padding: "24px", borderRadius: "8px", border: "1px solid #334155" },
  cardTitle: { marginTop: 0, marginBottom: "20px", fontSize: "18px", color: "#fff", borderBottom: "1px solid #334155", paddingBottom: "10px" },
  verticalForm: { display: "flex", flexDirection: "column", gap: "14px" },
  fieldLabel: { fontSize: "13px", fontWeight: "600", color: "#94a3b8" },
  textArea: { backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff", padding: "12px", borderRadius: "6px", fontSize: "14px", minHeight: "100px", resize: "vertical" },
  inputField: { backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff", padding: "10px 12px", borderRadius: "6px", fontSize: "14px" },
  primarySaveBtn: { backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", alignSelf: "flex-start" },
  fileInput: { color: "#94a3b8", fontSize: "14px" },
  invitationInbox: { display: "flex", flexDirection: "column", gap: "16px" },
  emptyText: { color: "#64748b", margin: 0, fontSize: "14px", textAlign: "center", padding: "10px 0" },
  inviteItem: { backgroundColor: "#0f172a", padding: "16px", borderRadius: "6px", border: "1px solid #334155" },
  inviteTitle: { margin: "0 0 6px 0", color: "#fff", fontSize: "16px" },
  inviteDesc: { margin: "0 0 10px 0", fontSize: "13px", color: "#94a3b8", lineHeight: "1.4" },
  inviteSender: { fontSize: "12px", color: "#64748b" },
  actionButtonGroup: { display: "flex", gap: "10px", marginTop: "12px" },
  acceptBtn: { backgroundColor: "#16a34a", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "4px", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
  declineBtn: { backgroundColor: "#dc2626", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "4px", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
  dangerCard: { backgroundColor: "#1e293b", padding: "24px", borderRadius: "8px", border: "1px solid #ef4444" },
  dangerTitle: { marginTop: 0, color: "#f87171", fontSize: "18px", marginBottom: "10px" },
  dangerText: { color: "#fca5a5", fontSize: "13px", margin: "0 0 16px 0", lineHeight: "1.5" },
  deleteAccountBtn: { backgroundColor: "#dc2626", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }
};