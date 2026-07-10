import { Task } from "../models/task.model.js";
import {Project} from "../models/project.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { sendNotification } from "../utils/notificationHelper.js";


export const createTask = asyncHandler(async(req,res)=>{
    const {projectId}=req.params;
    const {title,description,assignedTo,priority,dueDate}=req.body;

    if(!title || !description) throw new ApiError(400,"Task title and description are strictly required");

    const project=await Project.findById(projectId);
    if(!project) throw new ApiError(404,"target project workspace does not exist");

    const isOwnerOrMember=project.owner.toString()===req.user._id.toString() || project.members.includes(req.user._id);
    if(!isOwnerOrMember) throw new ApiError(403,"Access Forbidden: You are not a collabarator of this project");
    
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

    const project=await Project.findById(task.project);
    if(!project) throw new ApiError(404,"Parent project workspace not found");

    const isOwnerOrMember = 
        project.owner.toString() === req.user._id.toString() || 
        project.members.includes(req.user._id);
    if (!isOwnerOrMember) {
        throw new ApiError(403, "Access Forbidden: You cannot edit this task.");
    }

    // dynamic updates
    if (title !== undefined) {
        if (typeof title === "string" && title.trim() === "") {
            throw new ApiError(400, "Task title cannot be updated to an empty value.");
        }
        task.title = title.trim();
    }

    if (description !== undefined) {
        if (typeof description === "string" && description.trim() === "") {
            throw new ApiError(400, "Task description cannot be updated to an empty value.");
        }
        task.description = description.trim();
    }

    if (assignedTo !== undefined) {
        if (!Array.isArray(assignedTo)) {
            throw new ApiError(400, "assignedTo field must be a valid array of user IDs.");
        }
        task.assignedTo = assignedTo; // Updates the multi-assignee list
    }

    if (priority !== undefined) {
        const validPriorities = ["Low", "Medium", "High", "Critical"];
        if (!validPriorities.includes(priority)) {
            throw new ApiError(400, `Invalid priority. Must be one of: ${validPriorities.join(", ")}`);
        }
        task.priority = priority;
    }

    if (dueDate !== undefined) {
        task.dueDate = dueDate; // Can be null if the team clears the deadline
    }

    const updatedTask=await task.save();

    // 🔔 PLACE THE UPDATE NOTIFICATION TRIGGER HERE:
    if (assignedTo && assignedTo.length > 0) {
        // Map old assignees to strings so comparison loops work perfectly
        const previousAssignees = oldTask.assignedTo.map(id => id.toString());

        // Filter out anyone who was ALREADY on the task before this update
        const newlyAssignedMembers = assignedTo.filter(
            (memberId) => !previousAssignees.includes(memberId.toString())
        );

        // Only fire if there are actually new people added!
        if (newlyAssignedMembers.length > 0) {
            await sendNotification({
                recipients: newlyAssignedMembers, // Alerts ONLY the newcomers!
                senderId: req.user._id,
                type: "TASK_ASSIGNED",
                message: `You have been added to the task card: "${updatedTask.title}" by ${req.user.username}`,
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

    await Task.findByIdAndDelete(taskId);

    return res
    .status(200)
    .json(new ApiResponse(200,null,"Task successfully permanently purged from the pipeline"));
});