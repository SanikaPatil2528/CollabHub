import React, { useState, useEffect } from "react";
import { taskService } from "../services/taskService.js";

export default function TaskList({ projectId, onSelectTask }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Local state for the task creation form toggle
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTaskData, setNewTaskData] = useState({ title: "", description: "", priority: "low" });
  
  // Local state to track inline updates
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", priority: "low" });

  // 1. Fetch project tasks on component mount / projectId change
  const fetchTasks = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError("");
      const data = await taskService.getProjectTasks(projectId);
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  // 2. Create Task Action
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newTaskData.title.trim()) return;
    try {
      const createdTask = await taskService.createTask(projectId, {
        title: newTaskData.title.trim(),
        description: newTaskData.description.trim(),
        priority: newTaskData.priority,
        status: "To-Do" // Explicitly setting initial status expected by backend
      });
      setTasks((prev) => [...prev, createdTask]);
      setNewTaskData({ title: "", description: "", priority: "low" });
      setShowCreateForm(false);
    } catch (err) {
      alert(err.message);
    }
  };

  // 3. Update Status dropdown value
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updatedTask = await taskService.updateTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: updatedTask.status || newStatus } : t))
      );
    } catch (err) {
      alert(err.message);
      fetchTasks(); // Rollback local state on failure
    }
  };

  // 4. Save Text and Parameter Details Inline
  const handleSaveDetails = async (e, taskId) => {
    e.stopPropagation();
    if (!editForm.title.trim()) return alert("Task title cannot be empty.");
    try {
      const updatedTask = await taskService.updateTaskDetails(taskId, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        priority: editForm.priority
      });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? updatedTask : t)));
      setEditingTaskId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // 5. Delete Task Action
  const handleDeleteTask = async (e, taskId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this task?")) return;
    try {
      await taskService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      alert(err.message);
    }
  };

  const startEditing = (e, task) => {
    e.stopPropagation();
    setEditingTaskId(task._id);
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "low"
    });
  };

  return (
    <div style={styles.workspaceCard}>
      
      {/* Header Panel */}
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.panelTitle}>Workspace Task Registry</h2>
          <p style={styles.panelSubtitle}>Create, review, update parameters, or select tasks for deep comment threads.</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)} 
          style={showCreateForm ? styles.cancelBtn : styles.createBtn}
        >
          {showCreateForm ? "Close Form" : "➕ Create New Task"}
        </button>
      </div>

      {error && <div style={styles.errorBanner}>⚠️ {error}</div>}

      {/* Dynamic Creation Drawer */}
      {showCreateForm && (
        <form onSubmit={handleCreateSubmit} style={styles.creationForm}>
          <h4 style={{ margin: "0 0 10px 0", color: "#fff", fontSize: "14px" }}>New Task Details</h4>
          <div style={styles.formGrid}>
            <input 
              type="text" 
              placeholder="Task Title..." 
              value={newTaskData.title}
              onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
              style={styles.input}
              required
            />
            <select
              value={newTaskData.priority}
              onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value })}
              style={styles.select}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <textarea 
              placeholder="Provide clear task description deliverables..." 
              value={newTaskData.description}
              onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
              style={styles.textarea}
              rows="2"
            />
          </div>
          <button type="submit" style={styles.submitBtn}>Publish Task</button>
        </form>
      )}

      {/* Task Stack View */}
      <div style={styles.listStack}>
        {loading ? (
          <div style={styles.statusMessage}>Retrieving project backlog logs...</div>
        ) : tasks.length === 0 ? (
          <div style={styles.emptyState}>No operational tasks logged. Click 'Create New Task' to begin.</div>
        ) : (
          tasks.map((task) => {
            const isEditing = editingTaskId === task._id;

            return (
              <div 
                key={task._id} 
                onClick={() => !isEditing && onSelectTask(task)} 
                style={{ 
                  ...styles.taskCard, 
                  cursor: isEditing ? "default" : "pointer",
                  borderLeftColor: getPriorityColor(task.priority) 
                }}
              >
                {isEditing ? (
                  /* INLINE EDIT MODE */
                  <div style={styles.editModeLayout} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                      <input 
                        type="text" 
                        value={editForm.title} 
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        style={{ ...styles.input, flex: 2 }}
                      />
                      <select 
                        value={editForm.priority} 
                        onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                        style={{ ...styles.select, flex: 1 }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <textarea 
                      value={editForm.description} 
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      style={styles.textarea}
                      rows="2"
                    />
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button onClick={() => setEditingTaskId(null)} style={styles.cancelBtnSmall}>Cancel</button>
                      <button onClick={(e) => handleSaveDetails(e, task._id)} style={styles.saveBtnSmall}>Save Changes</button>
                    </div>
                  </div>
                ) : (
                  /* CARD PREVIEW MODE */
                  <div style={styles.previewModeLayout}>
                    <div style={styles.cardHeader}>
                      <div style={styles.titleGroup}>
                        <h4 style={styles.taskTitle}>{task.title}</h4>
                        <span style={{ ...styles.priorityBadge, backgroundColor: getPriorityColor(task.priority) + "22", color: getPriorityColor(task.priority) }}>
                          {task.priority}
                        </span>
                      </div>
                      
                      {/* Operation Bar Control Elements */}
                      <div style={styles.actionButtonGroup} onClick={(e) => e.stopPropagation()}>
                        <label style={styles.dropdownLabel}>Status:</label>
                        <select
                          value={task.status || "To-Do"}
                          onChange={(e) => handleStatusChange(task._id, e.target.value)}
                          style={styles.statusSelect}
                        >
                          <option value="To-Do">To-Do</option>
                          <option value="In-Progress">In-Progress</option>
                          <option value="Review">Review</option>
                          <option value="Done">Done</option>
                        </select>

                        <button onClick={(e) => startEditing(e, task)} style={styles.inlineEditBtn} title="Modify parameters">✏️</button>
                        <button onClick={(e) => handleDeleteTask(e, task._id)} style={styles.inlineDeleteBtn} title="Purge task">🗑️</button>
                      </div>
                    </div>

                    <p style={styles.taskDescription}>{task.description || "No descriptions set for this task resource."}</p>
                    
                    <div style={styles.cardFooter}>
                      <span style={styles.commentCountHint}>💬 Click card to load threaded task discussions</span>
                      <span style={{ ...styles.statusBadge, backgroundColor: getStatusColor(task.status) }}>
                        {task.status || "To-Do"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const getPriorityColor = (p) => {
  if (p?.toLowerCase() === "high") return "#ef4444";
  if (p?.toLowerCase() === "medium") return "#f59e0b";
  return "#64748b";
};

const getStatusColor = (s) => {
  if (s === "In-Progress") return "#3b82f6";
  if (s === "Review") return "#a855f7";
  if (s === "Done") return "#10b981";
  return "#475569";
};

const styles = {
  workspaceCard: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "24px", boxSizing: "border-box", width: "100%" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: "16px", marginBottom: "20px", flexWrap: "wrap", gap: "12px" },
  panelTitle: { margin: "0 0 4px 0", fontSize: "18px", color: "#fff" },
  panelSubtitle: { margin: 0, fontSize: "13px", color: "#94a3b8" },
  createBtn: { backgroundColor: "#38bdf8", color: "#0f172a", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" },
  cancelBtn: { backgroundColor: "#475569", color: "#cbd5e1", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" },
  creationForm: { backgroundColor: "#0f172a", border: "1px solid #334155", padding: "16px", borderRadius: "8px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "12px" },
  formGrid: { display: "flex", flexDirection: "column", gap: "10px" },
  input: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "6px", padding: "8px 12px", color: "#fff", fontSize: "13px" },
  select: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "6px", padding: "8px 12px", color: "#fff", fontSize: "13px" },
  textarea: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "6px", padding: "8px 12px", color: "#fff", fontSize: "13px", resize: "vertical" },
  submitBtn: { alignSelf: "flex-end", backgroundColor: "#10b981", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" },
  listStack: { display: "flex", flexDirection: "column", gap: "12px" },
  statusMessage: { textAlign: "center", color: "#94a3b8", padding: "20px", fontSize: "13px" },
  errorBanner: { color: "#ef4444", backgroundColor: "#ef444415", padding: "10px", borderRadius: "6px", fontSize: "13px", marginBottom: "16px", border: "1px solid #ef444433" },
  emptyState: { textAlign: "center", color: "#64748b", padding: "40px 0", fontSize: "13px", border: "1px dashed #334155", borderRadius: "8px" },
  taskCard: { backgroundColor: "#0f172a", border: "1px solid #334155", borderLeftWidth: "4px", borderRadius: "8px", padding: "16px" },
  previewModeLayout: { display: "flex", flexDirection: "column", gap: "10px" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" },
  titleGroup: { display: "flex", alignItems: "center", gap: "10px" },
  taskTitle: { margin: 0, fontSize: "15px", fontWeight: "600", color: "#f8fafc" },
  priorityBadge: { fontSize: "10px", fontWeight: "bold", padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" },
  actionButtonGroup: { display: "flex", alignItems: "center", gap: "8px" },
  dropdownLabel: { fontSize: "11px", color: "#64748b" },
  statusSelect: { backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", fontSize: "12px", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" },
  inlineEditBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "14px" },
  inlineDeleteBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "14px" },
  taskDescription: { margin: 0, fontSize: "13px", color: "#cbd5e1", lineHeight: "1.5" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", paddingTop: "8px", borderTop: "1px solid #1e293b" },
  commentCountHint: { fontSize: "11px", color: "#64748b", fontStyle: "italic" },
  statusBadge: { color: "#fff", fontSize: "10px", fontWeight: "bold", padding: "2px 8px", borderRadius: "4px" },
  editModeLayout: { display: "flex", flexDirection: "column", gap: "12px" },
  cancelBtnSmall: { backgroundColor: "#475569", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", fontSize: "12px", cursor: "pointer" },
  saveBtnSmall: { backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }
};