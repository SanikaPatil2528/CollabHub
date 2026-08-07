import axiosInstance from "./axios.js";

export const notificationService={

    getUserNotifications: async () => {
        try {
        const response = await axiosInstance.get("/notifications/");
        return response.data?.data || response.data || [];
        } catch (err) {
        throw new Error(err.response?.data?.message || "Failed to load notification inbox.");
        }
    },

    markNotificationAsRead: async (notificationId) => {
        try {
        const response = await axiosInstance.patch(`/notifications/${notificationId}`);
        return response.data?.data || response.data;
        } catch (err) {
        throw new Error(err.response?.data?.message || "Failed to update notification state.");
        }
    },

    markAllNotificationsAsRead: async () => {
        try {
        const response = await axiosInstance.patch("/notifications/");
        return response.data?.data || response.data;
        } catch (err) {
        throw new Error(err.response?.data?.message || "Failed to clear unread notifications.");
        }
    }

};