import { Project } from "../models/project.model.js"; 
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";


export const createProject = asyncHandler(async(req,res)=>{
    const {title,description,tags,githubLink}=req.body;
    if(!title || title.trim()==="") throw new ApiError(400,"Project title is strictly required");
    if(!description || description.trim()==="") throw new ApiError(400,"Project description is strictly required");

    // if github link provided : Validation of github url
    if(githubLink && githubLink.trim!==""){
        const githubRegex=/^(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;
        if(!githubRegex.test(githubLink.trim())) throw new ApiError(400,"Please provide a valid github repository URL (e.g., https://github.com/user/repo).");
    }

    // Initialize the workspace
    const project= await Project.create({
        title,
        description,
        tags:Array.isArray(tags)?tags:[],
        githubLink:githubLink?.trim() || "",
        owner: req.user._id,
        members:[req.user._id]
    });

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            project,
            "Project workspace initiated successfully"
        )
    );
});

export const getProjectDetails=asyncHandler(async(req,res)=>{
    const {projectId} = req.params;

    // fetch the project and populate member/owner text fields without leaking passwords
    const project = await Project.findById(projectId)
    .populate("owner","username email fullName avatar")
    .populate("members","username email fullName avatar skills bio");

    if(!project) throw new ApiError(404,"Project workspace not found");

    // security guard: Is the requesting user actually a member or owner of this project?
    const isMember=project.members.some(
        (member) => member._id.toString()===req.user._id.toString()
    );
    if(!isMember) throw new ApiError(403,"You do not have permission to view this project.");

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            project,
            "Project details retrieved successfully"
        )
    );
});

export const getUserProjects=asyncHandler(async(req,res)=>{
    // find all projects where the user is either the owner or the collaborator in the project
    const projects=await Project.find({
        $or:[
            {owner:req.user._id},
            {members:req.user._id}
        ]
    }).populate("owner","username avatar");

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            projects,
            "User workspace retrieved successfully"
        )
    );
});

export const updateProjectDetails=asyncHandler(async(req,res)=>{
    const {projectId} = req.params;
    const {title,description,tags,githubLink}=req.body;

    const project=await Project.findById(projectId);
    if(!project) throw new ApiError(404,"Project workspace not found");

    // RBAC guard(Role based access control): only the owner can modify project settings
    if(project.owner.toString()!==req.user._id.toString()) throw new ApiError(403,"Forbidden: Only the project owner can update workspace settings");

    // github url validation (if new oe provided)
    if(githubLink && githubLink.trim()!==""){
        const githubRegex=/^(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;
        if(!githubRegex.test(githubLink.trim())) throw new ApiError(400,"Please provide a valid GitHub repository URL");
    }

    //update fields dynamically if they are passed in the request body
    if(title!==undefined){
        if(title.trim()==="") throw new ApiError(400,"Project title cannot be emty.");
        project.title=title;
    }
    if(description!==undefined){
        if(description.trim()==="") throw new ApiError(400,"Project description cannot be emty.");
        project.description=description;
    }
    if(tags!==undefined) project.tags=Array.isArray(tags)?tags:[];
    if(githubLink!==undefined) project.githubLink=githubLink.trim();

    const updatedProject=await project.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedProject,
            "Project workspace settings updated successfully."
        )
    );
});

export const deleteProject = asyncHandler(async(req,res)=>{
    const {projectId}=req.params;

    const project = await Project.findById(projectId);
    if(!project) throw new ApiError(404,"Project workspace not found.");

    // RBAC Guard: Only owner can completely tear down the workspace
    if(project.owner.toString()!==req.user._id.toString()) throw new ApiError(402,"Fobidden: Only the project owner can delete this workspace");

    // wipe the project out of the collection
    await Project.findByIdAndDelete(projectId);

    /* 💡 Production Expansion Note: 
       When a project is deleted, you should ideally cascade-delete all child data 
       belonging to it (Tasks, Comments, Invitations) so you don't leave orphan 
       documents floating around in your MongoDB collections!
    */

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Project workspace completely torn down"));
});