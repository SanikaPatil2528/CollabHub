import React, { useState, useEffect } from "react";
import { projectService } from "../../api/projectService.js"; 
import { inviteService } from "../../api/inviteService.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ProjectDetails({ projectId, onProjectUpdated, defaultMatches = 5 }) {
  const { user: currentUser, searchUser } = useAuth();

  // Core Project Workspace States
  const [project, setProject] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Directory Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Gemini AI Recommendation Studio States
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [fetchingAi, setFetchingAi] = useState(false);
  // Separate dynamic state controller just for passing max matches down to the AI recommendation call
  const [aiLimitInput, setAiLimitInput] = useState("");

  const isOwner = project?.owner === currentUser?._id || project?.owner?._id === currentUser?._id;

  // 1. Synchronize project profile data on mount or project shift
  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const projectData = await projectService.getProjectDetails(projectId);
      setProject(projectData);
      setTitle(projectData.title || "");
      setDescription(projectData.description || "");
    } catch (err) {
      setError(err.message || "Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchProjectDetails();
  }, [projectId]);

  // 2. Debounced Directory Searching using AuthContext hook
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        setSearching(true);
        const users = await searchUser(searchQuery);
        setSearchResults(users);
      } catch (err) {
        console.error("Directory lookup failed:", err.message);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // 3. Save core metadata edits via projectService
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      setError("");
      await projectService.updateProject(projectId, { title, description });
      
      setProject((prev) => ({ 
        ...prev, 
        title, 
        description
      }));
      
      alert("Workspace metadata saved successfully!");
      if (onProjectUpdated) onProjectUpdated();
    } catch (err) {
      setError(err.message || "Failed to update project workspace.");
    }
  };

  // 4. Send invitation message to user email via inviteService
  const handleSendInvite = async (inviteeEmail) => {
    try {
      await inviteService.sendInvitation(projectId, inviteeEmail);
      alert(`Collaboration invitation delivered to ${inviteeEmail}!`);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      alert(err.message || "Failed to deliver collaborative invitation.");
    }
  };

  // 5. Revoke team access from project canvas via projectService
  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this contributor from your team?")) return;
    try {
      await projectService.removeMember(projectId, memberId);
      setProject((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m._id !== memberId),
      }));
      alert("Contributor unlinked from canvas.");
    } catch (err) {
      alert(err.message || "Failed to update team composition.");
    }
  };

  // 6. Request Gemini Context-Aware Partner Recommendations
  const handleFetchAiRecommendations = async () => {
    try {
      setFetchingAi(true);
      
      // Grabs user limit configuration from text box state, fallback to prop standard configuration parameter
      const targetMaxMatches = aiLimitInput.trim() !== "" ? Number(aiLimitInput) : defaultMatches;

      const recommendedUsers = await inviteService.getAIRecommendations(description, targetMaxMatches);
      setAiRecommendations(recommendedUsers);
    } catch (err) {
      alert(err.message || "Gemini engine matching failed.");
    } finally {
      setFetchingAi(false);
    }
  };

  if (loading) return <div style={styles.centerMsg}>Syncing project metadata blueprints...</div>;
  if (error && !project) return <div style={styles.errorBanner}>⚠️ {error}</div>;

  return (
    <div style={styles.container}>
      
      {/* LEFT COLUMN: Workspace Details & Gemini Studio */}
      <div style={styles.mainColumn}>
        
        {/* Core Metadata Editor */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>⚙️ Workspace Canvas Settings</h3>
          <form onSubmit={handleUpdateProject} style={styles.formStack}>
            <div>
              <label style={styles.inputLabel}>Project Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!isOwner}
                style={styles.textInput}
              />
            </div>
            <div>
              <label style={styles.inputLabel}>Core Goals & Engineering Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isOwner}
                rows={5}
                style={styles.textArea}
                placeholder="Detail codebase needs, target scope, or technical stacks..."
              />
            </div>
            {isOwner && (
              <button type="submit" style={styles.primaryBtn}>Save Modifications</button>
            )}
          </form>
        </div>

        {/* Gemini Match Studio Engine */}
        <div style={styles.card}>
          <div style={styles.aiHeader}>
            <div>
              <h3 style={styles.aiTitle}>✨ Gemini Intelligent Recruiter</h3>
              <p style={styles.cardSubtitle}>Analyzes engineering goals to surface contextually matched users</p>
            </div>
            
            {/* Context Controller for Dynamic AI Recommendations Parameter */}
            <div style={styles.aiActionBlock}>
              <input
                type="number"
                min="1"
                placeholder={`Count (${defaultMatches})`}
                value={aiLimitInput}
                onChange={(e) => setAiLimitInput(e.target.value)}
                disabled={fetchingAi}
                style={styles.aiLimitField}
              />
              <button 
                onClick={handleFetchAiRecommendations} 
                disabled={fetchingAi || !description.trim()} 
                style={styles.aiBtn}
              >
                {fetchingAi ? "Analyzing Stacks..." : "Scan & Match"}
              </button>
            </div>
          </div>

          {aiRecommendations.length > 0 && (
            <div style={styles.recGrid}>
              {aiRecommendations.map((rec) => (
                <div key={rec._id} style={styles.recCard}>
                  <div style={styles.recRow}>
                    <img src={rec.avatar || "https://placehold.co/40"} alt="avatar" style={styles.avatarImg} />
                    <div>
                      <h4 style={styles.recName}>{rec.fullName || rec.username}</h4>
                      <p style={styles.recUser}>@{rec.username}</p>
                    </div>
                  </div>
                  <p style={styles.recBio}>{rec.bio || "No description provided."}</p>
                  <div style={styles.skillRow}>
                    {rec.skills?.map((s, idx) => (
                      <span key={idx} style={styles.skillBadge}>{s}</span>
                    ))}
                  </div>
                  {rec.reasonForRecommendation && (
                    <p style={styles.aiReason}>💡 <em>{rec.reasonForRecommendation}</em></p>
                  )}
                  <button onClick={() => handleSendInvite(rec.email)} style={styles.inviteBtn}>
                    Send Invite
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Roster Management & Direct Invite Fields */}
      <div style={styles.sideColumn}>
        
        {/* Real-time search indexing */}
        {isOwner && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>🔍 Recipient Username Search</h3>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username..."
              style={styles.textInput}
            />
            
            {searching && <div style={styles.statusSub}>Querying directory index...</div>}
            
            {searchResults.length > 0 && (
              <div style={styles.dropdownResults}>
                {searchResults.map((u) => (
                  <div key={u._id} style={styles.searchRow}>
                    <div style={styles.searchDetails}>
                      <span style={styles.searchName}>@{u.username}</span>
                      <span style={styles.searchEmail}>{u.email}</span>
                    </div>
                    <button onClick={() => handleSendInvite(u.email)} style={styles.actionBtn}>
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Live Contributor Roster */}
        <div style={styles.card}>
          <div style={styles.rosterHeader}>
            <h3 style={styles.cardTitle}>👥 Team Contributors</h3>
            <span style={styles.rosterBadge}>
              {project?.members?.length || 0} Members
            </span>
          </div>
          <div style={styles.rosterList}>
            {(project?.members?.length || 0) === 0 ? (
              <p style={styles.emptyText}>No standalone contributors linked. Invite profiles above!</p>
            ) : (
              project?.members?.map((m) => (
                <div key={m._id} style={styles.memberCard}>
                  <div style={styles.memberInfo}>
                    <span style={styles.mName}>{m.fullName || m.username}</span>
                    <span style={styles.mUser}>@{m.username}</span>
                  </div>
                  {isOwner && m._id !== currentUser?._id && (
                    <button onClick={() => handleRemoveMember(m._id)} style={styles.trashBtn}>
                      Remove
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: { display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: "24px", padding: "24px", backgroundColor: "#0f172a", minHeight: "100vh", boxSizing: "border-box", width: "100%" },
  mainColumn: { display: "flex", flexDirection: "column", gap: "24px" },
  sideColumn: { display: "flex", flexDirection: "column", gap: "24px" },
  card: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column" },
  cardTitle: { margin: "0", color: "#fff", fontSize: "16px", fontWeight: "600" },
  cardSubtitle: { margin: "2px 0 0 0", color: "#64748b", fontSize: "12px" },
  formStack: { display: "flex", flexDirection: "column", gap: "16px", marginTop: "14px" },
  inputLabel: { display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: "bold", marginBottom: "6px", textTransform: "uppercase" },
  textInput: { width: "100%", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "6px", padding: "10px 12px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" },
  textArea: { width: "100%", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "6px", padding: "10px 12px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" },
  primaryBtn: { backgroundColor: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "6px", padding: "10px 20px", fontWeight: "bold", cursor: "pointer", fontSize: "14px", alignSelf: "flex-start" },
  aiHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: "14px", marginBottom: "14px", flexWrap: "wrap", gap: "12px" },
  aiTitle: { margin: 0, color: "#a855f7", fontSize: "16px", fontWeight: "600" },
  aiActionBlock: { display: "flex", gap: "8px", alignItems: "center" },
  aiLimitField: { width: "90px", backgroundColor: "#0f172a", border: "1px solid #49355e", borderRadius: "6px", padding: "8px 10px", color: "#fff", fontSize: "13px", outline: "none" },
  aiBtn: { backgroundColor: "#a855f7", color: "#fff", border: "none", borderRadius: "6px", padding: "9px 16px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" },
  recGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "14px" },
  recCard: { backgroundColor: "#0f172a", border: "1px solid #a855f740", borderRadius: "8px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" },
  recRow: { display: "flex", gap: "12px", alignItems: "center" },
  avatarImg: { width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "1px solid #334155" },
  recName: { margin: 0, color: "#fff", fontSize: "14px", fontWeight: "600" },
  recUser: { margin: 0, color: "#64748b", fontSize: "12px" },
  recBio: { margin: 0, color: "#cbd5e1", fontSize: "13px", lineHeight: "1.4" },
  skillRow: { display: "flex", flexWrap: "wrap", gap: "6px" },
  skillBadge: { backgroundColor: "#334155", color: "#94a3b8", fontSize: "11px", padding: "2px 8px", borderRadius: "4px" },
  aiReason: { margin: "4px 0", color: "#c084fc", fontSize: "12px", lineHeight: "1.4" },
  inviteBtn: { backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", fontWeight: "bold", fontSize: "12px", cursor: "pointer", alignSelf: "flex-start", marginTop: "4px" },
  statusSub: { color: "#64748b", fontSize: "12px", marginTop: "8px" },
  dropdownResults: { display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px", backgroundColor: "#0f172a", borderRadius: "6px", border: "1px solid #334155", padding: "8px" },
  searchRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: "4px", backgroundColor: "#1e293b" },
  searchDetails: { display: "flex", flexDirection: "column" },
  searchName: { color: "#38bdf8", fontSize: "13px", fontWeight: "bold" },
  searchEmail: { color: "#64748b", fontSize: "11px" },
  actionBtn: { backgroundColor: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "4px", padding: "4px 10px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" },
  rosterHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" },
  rosterBadge: { backgroundColor: "#334155", color: "#38bdf8", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" },
  rosterList: { display: "flex", flexDirection: "column", gap: "8px" },
  memberCard: { display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0f172a", padding: "10px 12px", borderRadius: "6px", border: "1px solid #334155" },
  memberInfo: { display: "flex", flexDirection: "column" },
  mName: { color: "#fff", fontSize: "13px", fontWeight: "600" },
  mUser: { color: "#64748b", fontSize: "11px" },
  trashBtn: { background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px", fontWeight: "bold" },
  emptyText: { color: "#475569", fontSize: "12px", textAlign: "center", margin: 0, padding: "10px 0" },
  centerMsg: { color: "#64748b", textAlign: "center", padding: "40px", fontSize: "14px" },
  errorBanner: { color: "#fca5a5", padding: "12px", backgroundColor: "#991b1b33", border: "1px solid #991b1b80", borderRadius: "8px", margin: "24px" }
};