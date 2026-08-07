import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Register(){
    const { register, error, setError } = useAuth();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [avatar, setAvatar] = useState(null);
    
    // New optional profile states
    const [bio, setBio] = useState("");
    const [skillsInput, setSkillsInput] = useState(""); 
    
    const [submitting, setSubmitting] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
        setAvatar(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!username || !email || !fullName || !password) {
        return setError("Username, email, Full Name, and password are strictly required.");
        }
        if (!avatar) {
        return setError("Avatar image file is strictly required.");
        }

        setSubmitting(true);
        
        const formData = new FormData();
        formData.append("username", username);
        formData.append("email", email);
        formData.append("fullName", fullName);
        formData.append("password", password);
        formData.append("avatarLocalPath", avatar);
        
        // Pass bio directly
        formData.append("bio", bio);
        
        // Convert comma-separated string string into a true clean array for your backend
        const skillsArray = skillsInput
        .split(",")
        .map(skill => skill.trim())
        .filter(skill => skill !== "");
        
        // Append the array properly to FormData
        formData.append("skills", JSON.stringify(skillsArray));

        try {
        await register(formData);
        navigate("/login");
        } catch (err) {
        console.log("Registration process encountered an error:", err.message);
        } finally {
        setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: "40px", maxWidth: "400px", margin: "0 auto" }}>
        <h2>Create Workspace Account</h2>

        {error && (
            <div style={{ color: "#ef4444", marginBottom: "16px", fontWeight: "bold" }}>
            {error}
            </div>
        )}

        <form onSubmit={handleSubmit}>
            {/* fullName */}
            <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>Full Name *</label>
            <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: "100%", padding: "8px", background: "#18181b", border: "1px solid #3f3f46", color: "#fff" }}
            />
            </div>

            {/* Username */}
            <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>Username *</label>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: "100%", padding: "8px", background: "#18181b", border: "1px solid #3f3f46", color: "#fff" }}
            />
            </div>

            {/* Email */}
            <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>Email Address *</label>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", padding: "8px", background: "#18181b", border: "1px solid #3f3f46", color: "#fff" }}
            />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>Password *</label>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", padding: "8px", background: "#18181b", border: "1px solid #3f3f46", color: "#fff" }}
            />
            </div>

            {/* Optional Bio Field */}
            <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>Short Bio (Optional)</label>
            <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                style={{ width: "100%", padding: "8px", background: "#18181b", border: "1px solid #3f3f46", color: "#fff", height: "60px", resize: "none" }}
            />
            </div>

            {/* Optional Skills Field */}
            <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>Skills (Optional - separate with commas)</label>
            <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="e.g. React, Node, Python"
                style={{ width: "100%", padding: "8px", background: "#18181b", border: "1px solid #3f3f46", color: "#fff" }}
            />
            </div>

            {/* Avatar */}
            <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>Profile Avatar Picture *</label>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ color: "#a1a1aa" }}
            />
            </div>

            <button 
            type="submit" 
            disabled={submitting}
            style={{ width: "100%", padding: "10px", background: "#10b981", color: "#fff", border: "none", cursor: "pointer" }}
            >
            {submitting ? "Processing Account..." : "Register"}
            </button>
        </form>

        {/* Login */}
        <p style={{ marginTop: "16px" }}>
            Already have an account? <Link to="/login" style={{ color: "#3b82f6" }}>Sign in</Link>
        </p>
        </div>
    );
}