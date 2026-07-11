import { Task } from "../models/task.model.js";
import {Project} from "../models/project.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { sendNotification } from "../utils/notificationHelper.js";
import {Notification} from "../models/notification.model.js";
import { Comment } from "../models/comment.model.js";


export const createTask = asyncHandler(async(req,res)=>{
    const {projectId}=req.params;
    const {title,description,assignedTo,priority,dueDate}=req.body;

    if(!title || !description) throw new ApiError(400,"Task title and description are strictly required");

    const project=await Project.findById(projectId);
    if(!project) throw new ApiError(404,"target project workspace does not exist");

    const isOwnerOrMember=project.owner.toString()===req.user._id.toString() || project.members.includes(req.user._id);
    if(!isOwnerOrMember) throw new ApiError(403,"Access Forbidden: You are not a collabarator of this project");

    //  🛡️ VALIDATION LAYER: Ensure all assignees belong to the workspace
    if (assignedTo && assignedTo.length > 0) {
        if (!Array.isArray(assignedTo)) {
            throw new ApiError(400, "assignedTo field must be a valid array of user IDs.");
        }

        // Build a set of all valid user IDs for this project workspace
        const validWorkspaceUserIds = new Set([
            project.owner.toString(),
            ...project.members.map(id => id.toString())
        ]);

        // Verify if any assigned user falls outside the project workspace group
        const invalidAssignees = assignedTo.filter(
            (userId) => !validWorkspaceUserIds.has(userId.toString())
        );

        if (invalidAssignees.length > 0) {
            throw new ApiError(
                400, 
                `Validation Failed: The following users do not belong to this project workspace: ${invalidAssignees.join(", ")}`
            );
        }
    }
    
    const task=await Task.create({
        project:projectId,
        createdBy:req.user._id,
        title,
        description,
        assignedTo:assignedTo || [],
        priority:priority || "Medium",
        dueDate
    });

    // SEND NOTIFICATION
    if (task.assignedTo && task.assignedTo.length > 0) {
        await sendNotification({
            recipients: task.assignedTo,
            senderId: req.user._id,
            type: "TASK_ASSIGNED",
            message: `You have been assigned to a new task: "${task.title}" by ${req.user.username}`,
            projectId,
            taskId: task._id
        });
    }

    return res
    .status(201)
    .json(new ApiResponse(201,task,"Task successfully initialized and added to the board"));
});

export const getProjectTasks=asyncHandler(async(req,res)=>{
    const {projectId}=req.params;
    const project=await Project.findById(projectId);
    if(!project) throw new ApiError(400,"Project workspace not found");

    const isOwnerOrMember=project.owner.toString()===req.user._id.toString() || project.members.includes(req.user._id);
    if(!isOwnerOrMember) throw new ApiError(403,"Access Forbidden: You are not a collabarator of this project");

    const tasks=await Task.find({project:projectId})
        .populate("assignedTo","username email avatar")
        .populate("createdBy","username email")
        .sort({createdAt:-1}); // newest tasks first
    
    return res
    .status(200)
    .json(new ApiResponse(200,tasks,"Project tasks fetched successfully"));
});

export const updateTaskStatus=asyncHandler(async(req,res)=>{
    const {taskId}=req.params;
    const {status}=req.body; // Expects "To-Do", "In-Progress", "Review", or "Done"
    const validStatuses = ["To-Do", "In-Progress", "Review", "Done"];
    if (!status || !validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const task=await Task.findById(taskId);
    if(!task) throw new ApiError(404,"Task caed not found");
    const project=await Project.findById(task.project);
    if(!project) throw new ApiError(404,"Parent project workspace not found");

    const isOwnerOrMember = 
        project.owner.toString() === req.user._id.toString() || 
        project.members.includes(req.user._id);
    if (!isOwnerOrMember) {
        throw new ApiError(403, "Access Forbidden: You cannot modify tasks in this workspace.");
    }

    task.status=status;
    await task.save();

    // SEND NOTIFICATION
    if (task.assignedTo && task.assignedTo.length > 0) {
        await sendNotification({
            recipients: task.assignedTo,
            senderId: req.user._id,
            type: "TASK_STATUS_UPDATED",
            message: `Task "${task.title}" was moved to "${status}" by ${req.user.username}`,
            projectId: project._id, // project object fetched earlier in this controller
            taskId: task._id
        });
    }

    return res
    .status(200)
    .json(new ApiResponse(200,task,"Task status updated successfully"));
});

export const updateTaskDetails=asyncHandler(async(req,res)=>{
    const {taskId}=req.params;
    const {title,description,assignedTo,priority,dueDate}=req.body;

    const task=await Task.findById(taskId);
    if(!task) throw new ApiError(404,"Task not found");

    // Snapshot the original state before updating
    const previousAssignees = task.assignedTo.map(id => id.toString());
    const originalTitle = task.title;
    const originalDescription = task.description;

    const project=await Project.findById(task.project);
    if(!project) throw new ApiError(404,"Parent project workspace not found");

    const isOwnerOrMember = 
        project.owner.toString() === req.user._id.toString() || 
        project.members.includes(req.user._id);
    if (!isOwnerOrMember) {
        throw new ApiError(403, "Access Forbidden: You cannot edit this task.");
    }

     // Dynamic updates mapping
    let detailsChanged = false;

    if (title !== undefined) {
        if (typeof title === "string" && title.trim() === "") {
            throw new ApiError(400, "Task title cannot be updated to an empty value.");
        }
        const cleanedTitle = title.trim();
        if (cleanedTitle !== originalTitle) detailsChanged = true;
        task.title = cleanedTitle;
    }

    if (description !== undefined) {
        if (typeof description === "string" && description.trim() === "") {
            throw new ApiError(400, "Task description cannot be updated to an empty value.");
        }
        const cleanedDesc = description.trim();
        if (cleanedDesc !== originalDescription) detailsChanged = true;
        task.description = cleanedDesc;
    }

    if (assignedTo !== undefined) {
        if (!Array.isArray(assignedTo)) {
            throw new ApiError(400, "assignedTo field must be a valid array of user IDs.");
        }

        // 🛡️ VALIDATION LAYER: Ensure all newly provided assignees belong to this project
        if (assignedTo.length > 0) {
            // Build a fast lookup set of authorized workspace users
            const validWorkspaceUserIds = new Set([
                project.owner.toString(),
                ...project.members.map(id => id.toString())
            ]);

            // Filter out any user IDs that aren't parts of this workspace set
            const invalidAssignees = assignedTo.filter(
                (userId) => !validWorkspaceUserIds.has(userId.toString())
            );

            if (invalidAssignees.length > 0) {
                throw new ApiError(
                    400, 
                    `Validation Failed: The following users do not belong to this project workspace: ${invalidAssignees.join(", ")}`
                );
            }
        }

        task.assignedTo = assignedTo;
    }

    if (priority !== undefined) {
        task.priority = priority;
    }

    if (dueDate !== undefined) {
        task.dueDate = dueDate;
    }

    const updatedTask=await task.save();
    // =========================================================================
    // 🔔 SMART NOTIFICATION ROUTER
    // =========================================================================
    
    // SCENARIO A: Task content (Title/Description) changed -> Notify existing team
    if (detailsChanged && previousAssignees.length > 0) {
        await sendNotification({
            recipients: previousAssignees, // Alerts everyone who was already working on it
            senderId: req.user._id,
            type: "TASK_DETAILS_UPDATED", // Context: Task context modification
            message: `The details for your task "${updatedTask.title}" were updated by ${req.user.username}`,
            projectId: updatedTask.project,
            taskId: updatedTask._id
        });
    }

    // SCENARIO B: Check if brand-new people were introduced in this update
    if (assignedTo && assignedTo.length > 0) {
        const newlyAssignedMembers = assignedTo.filter(
            (memberId) => !previousAssignees.includes(memberId.toString())
        );

        if (newlyAssignedMembers.length > 0) {
            await sendNotification({
                recipients: newlyAssignedMembers, // Welcomes only the newcomers
                senderId: req.user._id,
                type: "TASK_ASSIGNED",
                message: `You have been added to a new task card: "${updatedTask.title}" by ${req.user.username}`,
                projectId: updatedTask.project,
                taskId: updatedTask._id
            });
        }
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updatedTask,"Task details updated successfully"));
});

export const getMyTasks=asyncHandler(async(req,res)=>{
    const tasks=await Task.find({
        assignedTo:req.user._id
    })
    .populate("project","title")
    .sort({dueDate:1}) // sort by closest deadline first

    return res
    .status(200)
    .json(new ApiResponse(200,tasks,"Your personalized tasks aggregated successfully"));
});

export const deleteTask=asyncHandler(async(req,res)=>{
    const {taskId}=req.params;
    const task=await Task.findById(taskId);
    if(!task) throw new ApiError(404,"Task card not found");

    const project=await Project.findById(task.project);
    if(!project) throw new ApiError(404,"PArent project workspace not found");

    const isOwnerOrMember = 
        project.owner.toString() === req.user._id.toString() || 
        project.members.includes(req.user._id);

    if (!isOwnerOrMember) {
        throw new ApiError(403, "Access Forbidden: You cannot remove items from this project.");
    }

    // RUN CASCADING TEARDOWN (Wipes all nested comments inside this taskId)
    await Comment.deleteMany({ task: taskId });

    console.log(`[Teardown Engine] Comments purged cleanly. Dropping task document.`);

    await Task.findByIdAndDelete(taskId);

    return res
    .status(200)
    .json(new ApiResponse(200,null,"Task successfully permanently purged from the pipeline"));
});