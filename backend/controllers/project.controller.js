import { Project } from "../models/project.model.js"; 
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { Task } from "../models/task.model.js";
import { Invitation } from "../models/invitation.model.js";
import { Notification } from "../models/notification.model.js";
import { Comment } from "../models/comment.model.js";


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

     /* 💡 Production Expansion Note: 
       When a project is deleted, you should ideally cascade-delete all child data 
       belonging to it (Tasks, Comments, Invitations) so you don't leave orphan 
       documents floating around in your MongoDB collections!
    */

    // CASCADING TEARDOWN (Executed concurrently in parallel for max performance)
    console.log(`[Teardown Engine] Initializing complete wipe for project: ${project.title}`);
    
    await Promise.all([
        Task.deleteMany({ project: projectId }),         // Wipes all tasks on the Kanban board
        Comment.deleteMany({ project: projectId }),      // Wipes all task-level & project-level comments
        Invitation.deleteMany({ project: projectId }),   // Clears out pending or stale team invites
        Notification.deleteMany({ project: projectId })  // Drops all relevant in-app alerts
    ]);

    console.log(`[Teardown Engine] Ecosystem wiped. Proceeding with project document removal.`);

    // wipe the project out of the collection
    await Project.findByIdAndDelete(projectId);

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Project workspace completely torn down"));
});

export const leaveProject= asyncHandler(async(req,res)=>{
    const {projectId}=req.params;
    const project=await Project.findById(projectId);
    if(!project) throw new ApiError(404,"Project workspace not found");

    // owner cannot leave the project
    if(project.owner.toString()===req.user._id) throw new ApiError(400,"As the project owner, you cannot leave this project. You must delete the project or transfer ownership.");

    const isMember=project.members.includes(req.user._id);
    if(!isMember) throw new ApiError(400,"You are not a registered member of this project workspace");

    // automatically pull the user out of the project's member array
    await Project.findByIdAndUpdate(
        projectId,
        {
            $pull:{members:req.user._id}
        },
        {new:true}
    );

    return res
    .status(200)
    .json(new ApiResponse(200,null,"You have successfully left the project workspace"));
});

export const removeMember = asyncHandler(async(req,res)=>{
    const {projectId}=req.params;
    const {memberId}=req.body;
    if(!memberId) throw new ApiError(400,"Member ID to eject is required");

    const project=await Project.findById(projectId);
    if(!project) throw new ApiError(404,"Project workspace not found");

    // only project owner can remove some member
    if(project.owner.toString()!==req.user._id.toString()) throw new ApiError(403,"Forbidden: Only the project owner can remove team members");

    // owner cannot remove himself
    if(memberId===req.user._id.toString()) throw new ApiError(400,"You cannot remove yourself.");
    
    const isMember=project.members.includes(memberId);
    if(!isMember) throw new ApiError(400,"The specified user is not a member of this project");

    const updatedProject=await Project.findByIdAndUpdate(
        projectId,
        {
            $pull:{members:memberId}
        },
        {new:true}
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200,updatedProject,"Team member removed successfully from the workspace"));
});