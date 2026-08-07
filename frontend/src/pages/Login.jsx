import { useState } from "react";
import {useAuth} from "../context/AuthContext.jsx"
import { useNavigate,Link } from "react-router-dom";


export default function Login(){
    const {login,error,setError}=useAuth();
    const navigate=useNavigate();

    const [identifier,setIdentifier]=useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit=async (e)=>{
        e.preventDefault();
        if (!identifier || !password) return setError("Please fill in all credentials.");
        setSubmitting(true);

        try {
            await login(identifier,password);
            navigate("/profile");
        } catch (err) {
            // caught and managed inside context layer
            console.log("Authentication failed: ",err.message);
        } finally{
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: "40px", maxWidth: "400px", margin: "0 auto" }}>
            <h2>Sign In to CollabHub</h2>
            
            {error && (
                <div style={{ color: "#ef4444", marginBottom: "16px", fontWeight: "bold" }}>
                {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Identifier */}
                <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "4px" }}>Email or Username</label>
                <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    style={{ width: "100%", padding: "8px", background: "#18181b", border: "1px solid #3f3f46", color: "#fff" }}
                />
                </div>
                {/* Password */}
                <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "4px" }}>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: "100%", padding: "8px", background: "#18181b", border: "1px solid #3f3f46", color: "#fff" }}
                />
                </div>

                <button 
                type="submit" 
                disabled={submitting}
                style={{ width: "100%", padding: "10px", background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}
                >
                {submitting ? "Verifying..." : "Login"}
                </button>
            </form>

            {/* Register */}
            <p style={{ marginTop: "16px" }}>
                New to the workspace? <Link to="/register" style={{ color: "#3b82f6" }}>Create an account</Link>
            </p>
        </div>
    );
}