import axiosInstance from "./axios.js";

export const inviteService={

    sendInvitation: async (projectId, inviteeEmail) => {
        try {
        const response = await axiosInstance.post("/invitations/", {
            projectId,
            inviteeEmail,
        });
        return response.data?.data || response.data;
        } catch (err) {
        throw new Error(err.response?.data?.message || "Failed to send invitation.");
        }
    },

    getMyPendingInvitations: async () => {
        try {
        const response = await axiosInstance.get("/invitations/");
        return response.data?.data || response.data || [];
        } catch (err) {
        throw new Error(err.response?.data?.message || "Failed to load pending invitations.");
        }
    },

    respondToInvitation: async (invitationId, action) => {
        try {
        if (!["Accepted", "Declined"].includes(action)) {
            throw new Error("Invalid action. Choose 'Accepted' or 'Declined'.");
        }
        const response = await axiosInstance.patch(`/invitations/respond/${invitationId}`, {
            action,
        });
        return response.data?.data || response.data;
        } catch (err) {
        throw new Error(err.response?.data?.message || `Failed to ${action.toLowerCase()} invitation.`);
        }
    },

    getAIRecommendations: async (projectDescription, maxMatches = 5) => {
        try {
        const response = await axiosInstance.post("/ai/recommend-team", {
            projectDescription,
            maxMatches,
        });
        return response.data?.data || response.data || [];
        } catch (err) {
        throw new Error(err.response?.data?.message || "AI failed to process recommendation matching.");
        }
    }

};