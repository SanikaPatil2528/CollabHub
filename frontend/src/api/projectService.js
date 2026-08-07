import axiosInstance from "./axios.js";

export const projectService={
    // 1.links to createProject (POST)
    createProject: async(projectData)=>{
        const response= await axiosInstance.post("/projects",projectData);
        return response.data?.data || response.data;
    },

    // 2.links to getUserProjects (GET)
    getUserProjects:async()=>{
        const response=await axiosInstance.get("/projects");
        return response.data?.data || response.data;
    },

    // 3. Links to getProjectDetails (GET /:projectId)
    getProjectDetails: async (projectId) => {
        const response = await axiosInstance.get(`/projects/${projectId}`);
        return response.data?.data || response.data;
    },

    // 4. Links to updateProjectDetails (PATCH /:projectId)
    updateProject: async (projectId, updatedData) => {
        const response = await axiosInstance.patch(`/projects/${projectId}`, updatedData);
        return response.data?.data || response.data;
    },

    // 5. Links to deleteProject (DELETE /:projectId)
    deleteProject: async (projectId) => {
        const response = await axiosInstance.delete(`/projects/${projectId}`);
        return response.data?.data || response.data;
    },

    // 6. Links to leaveProject (POST)
    leaveProject: async (projectId) => {
        const response = await axiosInstance.post(`/projects/${projectId}/leave`);
        return response.data?.data || response.data;
    },

    // 7. Links to removeMember (PATCH /:projectId/remove-member)
    removeMember: async (projectId, memberId) => {
        const response = await axiosInstance.patch(`/projects/${projectId}/remove-member`, { memberId });
        return response.data?.data || response.data;
    }
    
};