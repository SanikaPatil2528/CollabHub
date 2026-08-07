import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

// Core UI Framing Component
import Navbar from "./components/GlobalNavbar.jsx";

// Roots Pages Ecosystem
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import ProjectHub from "./pages/ProjectHub.jsx"; // Internalizes both Listing & CreateProject panels

// Workspace Subsystem Entry
import ProjectDetails from "./pages/ProjectWorkspace/ProjectDetails.jsx";

function AppLayout() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ color: "#64748b", padding: "40px", textAlign: "center", backgroundColor: "#0f172a", minHeight: "100vh" }}>
        Syncing application architecture context...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#fff" }}>
      {/* Global Framework Navigation Banner */}
      {token && <Navbar />}
      
      <div style={{ paddingTop: token ? "60px" : "0px" }}>
        <Routes>
          {/* Unauthenticated Access Terminals */}
          <Route path="/login" element={!token ? <Login /> : <Navigate to="/profile" replace />} />
          <Route path="/register" element={!token ? <Register /> : <Navigate to="/profile" replace />} />

          {/* Authenticated Workspace Environments */}
          <Route path="/project-hub" element={token ? <ProjectHub /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={token ? <Profile /> : <Navigate to="/login" replace />} />
          
          {/* Main workspace terminal maps straight here from Hub links */}
          <Route path="/projects/:projectId" element={token ? <ProjectDetails /> : <Navigate to="/login" replace />} />

          {/* Core Catchall Fallback Logic */}
          <Route path="*" element={<Navigate to={token ? "/project-hub" : "/login"} replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}