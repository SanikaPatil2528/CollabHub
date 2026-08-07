import axiosInstance from "./axios.js";

export const CommentService={

    createComment: async(projectId,content,taskId=null)=>{
        try {
            const payload={projectId,content};
            if(taskId) payload.taskId=taskId;
            const response=await axiosInstance.post("/comments",payload);
            return response.data?.data || response.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to post comment.");
        }
    },

    getProjectComments: async(projectId)=>{
        try {
            const response=await axiosInstance.get(`/comments/project/${projectId}`);
            return response.data?.data || response.data || [];
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to retrieve project comments.");
        }
    },

    getTaskComments: async(taskId)=>{
        try {
            const response=await axiosInstance.get(`/comments/task/${taskId}`);
            return response.data?.data || response.data || [];
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to retrieve task comments");
        }
    },

    updateComment: async (commentId, content) => {
        try {
        const response = await axiosInstance.patch(`/comments/${commentId}`, { content });
        return response.data?.data || response.data;
        } catch (err) {
        throw new Error(err.response?.data?.message || "Failed to update comment.");
        }
    },

    deleteComment: async (commentId) => {
        try {
        const response = await axiosInstance.delete(`/comments/${commentId}`);
        return response.data?.data || response.data;
        } catch (err) {
        throw new Error(err.response?.data?.message || "Failed to delete comment.");
        }
    }

};