import axiosInstance from "./axios.js";


export const taskService={

    createTask: async (projectId, taskData) => {
        try {
        const response = await axiosInstance.post(`/tasks/project/${projectId}`, taskData);
        return response.data?.data || response.data;
        } catch (err) {
        throw new Error(err.response?.data?.message || "Failed to create task card.");
        }
    },

    getProjectTasks: async (projectId) => {
        try {
        const response = await axiosInstance.get(`/tasks/project/${projectId}`);
        return response.data?.data || response.data || [];
        } catch (err) {
        throw new Error(err.response?.data?.message || "Failed to retrieve project tasks.");
        }
    },

    updateTaskStatus: async (taskId, status) => {
        try {
        if (!["To-Do", "In-Progress", "Review", "Done"].includes(action)) {
            throw new Error("Invalid action. Choose from ['To-Do' , 'In-Progress' , 'Review' , 'Done'].");
        }
        const response = await axiosInstance.patch(`/tasks/status/${taskId}`, { status });
        return response.data?.data || response.data;
        } catch (err) {
        throw new Error(err.response?.data?.message || "Failed to update task status lane.");
        }
    },

    updateTaskDetails: async (taskId, updatedDetails) => {
        try {
        const response = await axiosInstance.patch(`/tasks/${taskId}`, updatedDetails);
        return response.data?.data || response.data;
        } catch (err) {
        throw new Error(err.response?.data?.message || "Failed to update task details configuration.");
        }
    },

    getMyTasks: async () => {
        try {
        const response = await axiosInstance.get("/tasks/me");
        return response.data?.data || response.data || [];
        } catch (err) {
        throw new Error(err.response?.data?.message || "Failed to aggregate user tasks portfolio.");
        }
    },

    deleteTask: async (taskId) => {
        try {
        const response = await axiosInstance.delete(`/tasks/${taskId}`);
        return response.data?.data || response.data;
        } catch (err) {
        throw new Error(err.response?.data?.message || "Failed to execute cascading task teardown.");
        }
    }

};