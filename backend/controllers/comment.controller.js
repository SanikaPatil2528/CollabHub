import { Comment } from "../models/comment.model.js";
import {Task} from "../models/task.model.js";
import {Project} from "../models/project.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

// general or task specific
export const createComment=asyncHandler(async(req,res)=>{
    const {projectId}=req.params;
    const {content,taskId}=req.body; // taskId is optional
    if(!content || content.trim()==="") throw new ApiError(400,"Comment text content cannot be empty");

    const project=await Project.findById(projectId);
    if(!project) throw new ApiError(404,"Project workspace not found");

    const isOwnerOrMember = 
        project.owner.toString() === req.user._id.toString() || 
        project.members.includes(req.user._id);

    if (!isOwnerOrMember) {
        throw new ApiError(403, "Access Forbidden: You cannot chat in this workspace.");
    }

    // task specific validation fork
    let finalTaskId=null;
    if(taskId){
        const task=await Task.findById(taskId);
        if(!task) throw new ApiError(404,"Target task card does not exist");
        if(task.project.toString()!==projectId) throw new ApiError(400, "Security mismatch: Task does not belong to this project");
        finalTaskId=task._id;
    }

    const comment=await Comment.create({
        content:content.trim(),
        author:req.user._id,
        project:projectId,
        task:finalTaskId // stores objectId for task-chats, or null for project-chats
    });

    const populatedComment=await Comment.findById(comment._id).populate("author","username email avatar");

    return res
    .status(201)
    .json(new ApiResponse(201,populatedComment,"Message broadcasted successfully"));
});

export const getTaskComments=asyncHandler(async(req,res)=>{
    const {taskId}=req.params;
    const task=await Task.findById(taskId);
    if(!task) throw new ApiError(404,"Task card not found");

    const comments=await Comment.find({task:taskId})
        .populate("author","username email avatar")
        .sort({createdAt:1}); // oldest first

    return res
    .status(200)
    .json(new ApiResponse(200,comments,"Task Comments broadcasted"));
});

// get general project comments (main chat room hub)
export const getProjectComments=asyncHandler(async(req,res)=>{
    const {projectId}=req.params;
    const project=await Project.findById(projectId);
    if(!project) throw new ApiError(404,"Project workspace not found.");

    const comments=await Comment.find({
        project:projectId,
        task:null
    })
    .populate("author","username email avatar")
    .sort({createdAt:1});

    return res
        .status(200)
        .json(new ApiResponse(200,comments,"General workspace message board loaded"));
});

export const updateComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params;
    const {content}=req.body;

    if(!content || content.trim()==="") throw new ApiError("Comment content cannot be updated to an empty value");

    const comment=await Comment.findById(commentId);
    if(!comment) throw new ApiError(404,"Comment not found");

    // Ownership guard: Only the person who wrote it can edit it
    if(comment.author.toString()!==req.user._id.toString()) throw new ApiError(403,"Access Forbidden: You can only edit your own comments");

    comment.content=content.trim();
    comment.editedAt=new Date();
    await comment.save();

    // Re-populate author details so the frontend UI doesn't lose user metadata
    const updatedComment=await Comment.findById(comment._id).populate("author","username email avatar");

    return res
        .status(200)
        .json(new ApiResponse(200,updatedComment,"Comment updated successfully"));
});

export const deleteComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params;
    const comment=await Comment.findById(commentId);
    if(!comment) throw new ApiError(404,"Comment not found");

    const project=await Project.findById(comment.project);
    if(!project) throw new ApiError(404,"Parent project workspace not found");

    // guard: User can delete comment only if he is author or project owner
    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isProjectOwner = project.owner.toString() === req.user._id.toString();
    if (!isAuthor && !isProjectOwner) {
        throw new ApiError(403, "Access Forbidden: You do not have permission to delete this comment.");
    }

    await Comment.findByIdAndDelete(commentId);

    return res
    .status(200)
    .json(new ApiResponse(200,null,"Comment deleted successfully"));
});