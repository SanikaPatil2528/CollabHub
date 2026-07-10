/**
 * Triggers a notification for one or more users safely.
 * @param {Object} options
 * @param {Array|String} options.recipients - An array of User IDs or a single User ID string.
 * @param {String} options.senderId - The ID of the user triggering the event (req.user._id).
 * @param {String} options.type - "TASK_ASSIGNED", "NEW_COMMENT", "PROJECT_INVITE", or "TASK_STATUS_UPDATED".
 * @param {String} options.message - The notification body text.
 * @param {String} options.projectId - The parent project workspace ID.
 * @param {String} [options.taskId=null] - (Optional) The specific task card ID.
 */

export const sendNotification = async({
    recipients,
    senderId,
    type,
    message,
    projectId,
    taskId=null
})=>{
    try {
        // Ensure recipients is always treated as an array for unified handling
        const recipientList = Array.isArray(recipients) ? recipients : [recipients];
        // Filter out the sender so they never receive notifications for their own actions
        const targetRecipients = recipientList.filter(
            (id) => id.toString() !== senderId.toString()
        );

        if (targetRecipients.length === 0) return;

        // map over the final targets and buil the db creation array
        const notificationPromises=targetRecipients.map((recipientId)=>
            Notification.create({
                recipient:recipientId,
                sender:senderId,
                type,
                message,
                project:projectId,
                task:taskId
            })
        );

        // fire them all in parallel asynchronously
        await Promise.all(notificationPromises);
    } catch (error) {
        // Log the error locally so a failed notification background process doesn't crash the main user request thread.
        console.error("Background Notification Error logged",error.message);
    }
};