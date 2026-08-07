import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { projectService } from "../api/projectService";

export default function CreateProject() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: "",
    githubLink: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(false);

    // Minor client-side sanity check before hitting the network
    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Title and description are required fields.");
      return;
    }

    try {
      setLoading(true);
      
      // Process tags string into an array of trimmed strings for the backend
      const processedTags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");

      await projectService.createProject({
        title: formData.title,
        description: formData.description,
        githubLink: formData.githubLink,
        tags: processedTags
      });

      // Navigate back to the dashboard upon successful workspace generation
      navigate("/dashboard");
    } catch (err) {
      // The component catches the raw error message here and displays it
      setError(err.message || "Failed to initiate project workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "60px auto", padding: "0 20px" }}>
      <h2 style={{ fontSize: "24px", color: "#fff", marginBottom: "8px" }}>Initiate New Workspace</h2>
      <p style={{ color: "#a1a1aa", marginBottom: "24px" }}>Set up your project board, configure details, and invite collaborators.</p>

      {error && (
        <div style={{ background: "#450a0a", border: "1px solid #dc2626", color: "#fca5a5", padding: "12px", borderRadius: "6px", marginBottom: "20px", fontSize: "14px" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* title */}
        <div>
          <label style={{ display: "block", color: "#e4e4e7", fontSize: "14px", marginBottom: "6px" }}>Project Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., E-Commerce Platform"
            style={{ width: "100%", padding: "10px 12px", background: "#18181b", border: "1px solid #3f3f46", borderRadius: "6px", color: "#fff" }}
          />
        </div>

        {/* description */}
        <div>
          <label style={{ display: "block", color: "#e4e4e7", fontSize: "14px", marginBottom: "6px" }}>Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your workspace goals, milestones, and scope..."
            rows="4"
            style={{ width: "100%", padding: "10px 12px", background: "#18181b", border: "1px solid #3f3f46", borderRadius: "6px", color: "#fff", resize: "vertical" }}
          />
        </div>

        {/* Tags */}
        <div>
          <label style={{ display: "block", color: "#e4e4e7", fontSize: "14px", marginBottom: "6px" }}>Tags (Comma separated)</label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g., react, node, mongodb"
            style={{ width: "100%", padding: "10px 12px", background: "#18181b", border: "1px solid #3f3f46", borderRadius: "6px", color: "#fff" }}
          />
        </div>

        {/* Git link */}
        <div>
          <label style={{ display: "block", color: "#e4e4e7", fontSize: "14px", marginBottom: "6px" }}>GitHub Repository URL</label>
          <input
            type="text"
            name="githubLink"
            value={formData.githubLink}
            onChange={handleChange}
            placeholder="https://github.com/username/repo"
            style={{ width: "100%", padding: "10px 12px", background: "#18181b", border: "1px solid #3f3f46", borderRadius: "6px", color: "#fff" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: "12px", background: loading ? "#3f3f46" : "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontSize: "16px", cursor: loading ? "not-allowed" : "pointer", marginTop: "10px" }}
        >
          {loading ? "Generating Workspace..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}