import React, { useState } from "react";
import TaskList from "./TaskList.jsx";
import GeneralChat from "./GeneralChat.jsx";
import TaskCommentsModal from "./TaskCommentsModal.jsx";

export default function ProjectBoard({ projectId }) {
  // Global state to track which task card is clicked for comment threading
  const [selectedTask, setSelectedTask] = useState(null);

  if (!projectId) {
    return (
      <div style={styles.errorState}>
        ⚠️ No project selected. Please select a workspace from your dashboard.
      </div>
    );
  }

  return (
    <div style={styles.boardGrid}>
      
      {/* Left Column: Core Task Management Stack */}
      <div style={styles.leftColumn}>
        <TaskList 
          projectId={projectId} 
          onSelectTask={(task) => setSelectedTask(task)} 
        />
      </div>

      {/* Right Column: General Live Chat Feed */}
      <div style={styles.rightColumn}>
        <GeneralChat projectId={projectId} />
      </div>

      {/* Conditional Portal Modal: Fires when a task card is selected */}
      {selectedTask && (
        <TaskCommentsModal 
          task={selectedTask} 
          projectId={projectId} 
          onClose={() => setSelectedTask(null)} 
        />
      )}
      
    </div>
  );
}

const styles = {
  boardGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
    gap: "24px",
    padding: "24px",
    backgroundColor: "#0f172a",
    minHeight: "100vh",
    boxSizing: "border-box",
    width: "100%"
  },

  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    minWidth: 0 // Prevents grid layout blowouts from long content strings
  },

  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    minWidth: 0
  },
  
  errorState: {
    color: "#94a3b8",
    textAlign: "center",
    padding: "40px",
    fontSize: "14px",
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    margin: "24px",
    border: "1px solid #334155"
  }
};