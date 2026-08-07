import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { projectService } from "../api/projectService.js";
import GlobalNavbar from "../components/GlobalNavbar.jsx";
import CreateProject from "./CreateProject.jsx"; // Importing your exact component



export default function ProjectHub() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getUserProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div style={styles.pageContainer}>
      <GlobalNavbar />

      <div style={styles.mainContent}>
        <div style={styles.splitGrid}>
          
          {/* LEFT COLUMN: Renders your exact CreateProject component */}
          <div style={styles.formColumn}>
            <div style={styles.formWrapper}>
              <CreateProject />
            </div>
          </div>

          {/* RIGHT COLUMN: MY PROJECTS LIST */}
          <div style={styles.listColumn}>
            <h2 style={styles.sectionTitle}>My Workspaces ({projects.length})</h2>
            
            {loading ? (
              <div style={styles.centeredState}>Retrieving project matrices...</div>
            ) : projects.length === 0 ? (
              <div style={styles.emptyState}>
                <h3 style={{ margin: "0 0 8px 0", color: "#fff" }}>No active workspaces yet</h3>
                <p style={{ color: "#94a3b8", margin: 0, fontSize: "14px" }}>
                  Use the left panel form to provision your first project.
                </p>
              </div>
            ) : (
              <div style={styles.projectsStack}>
                {projects.map((project) => (
                  <div 
                    key={project._id} 
                    style={styles.projectItem}
                    onClick={() => navigate(`/projects/${project._id}`)}
                  >
                    <div style={styles.projectInfo}>
                      <h3 style={styles.projectTitle}>{project.title}</h3>
                      <p style={styles.projectDesc}>
                        {project.description?.length > 120 
                          ? `${project.description.substring(0, 120)}...` 
                          : project.description || "No description provided."}
                      </p>
                      
                      {project.tags && project.tags.length > 0 && (
                        <div style={styles.tagsContainer}>
                          {project.tags.map((tag, idx) => (
                            <span key={idx} style={styles.tagBadge}>#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={styles.projectFooter}>
                      <span style={styles.memberTag}>
                        👤 {project.members?.length || 1} {project.members?.length === 1 ? "member" : "members"}
                      </span>
                      <span style={styles.enterLink}>Open Workspace →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}


const styles = {
  pageContainer: { minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc" },
  mainContent: { padding: "40px", maxWidth: "1300px", margin: "0 auto" },
  splitGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "50px", alignItems: "start" },
  formColumn: { display: "flex", flexDirection: "column" },
  // Wraps your component nicely inside the split panel
  formWrapper: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "10px 24px 30px 24px" }, 
  listColumn: { display: "flex", flexDirection: "column", marginTop: "60px" },
  sectionTitle: { fontSize: "22px", fontWeight: "600", color: "#fff", marginBottom: "24px", marginTop: 0 },
  centeredState: { textAlign: "center", padding: "40px", color: "#94a3b8" },
  emptyState: { backgroundColor: "#1e293b", border: "1px dashed #334155", borderRadius: "8px", padding: "40px", textAlign: "center" },
  projectsStack: { display: "flex", flexDirection: "column", gap: "16px" },
  projectItem: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "20px", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "border-color 0.2s" },
  projectTitle: { margin: "0 0 6px 0", fontSize: "18px", color: "#fff" },
  projectDesc: { margin: "0 0 14px 0", fontSize: "14px", color: "#94a3b8", lineHeight: "1.5" },
  tagsContainer: { display: "flex", flexWrap: "wrap", gap: "6px" },
  tagBadge: { backgroundColor: "#0f172a", color: "#38bdf8", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", border: "1px solid #334155" },
  projectFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #334155", paddingTop: "12px", marginTop: "14px" },
  memberTag: { fontSize: "12px", color: "#64748b" },
  enterLink: { fontSize: "12px", color: "#38bdf8", fontWeight: "600" }
};