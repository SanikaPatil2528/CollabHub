import { Invitation } from "../models/invitation.model.js";
import {Project} from "../models/project.model.js";
import {User} from "../models/user.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendNotification } from "../utils/notificationHelper.js";


export const sendInvitation = asyncHandler(async(req,res)=>{
    const {projectId,inviteeEmail}= req.body;
    if(!projectId || !inviteeEmail || inviteeEmail.trim==="") throw new ApiError(400,"Project ID and Invitee email are required");

    const emailClean=inviteeEmail.trim().toLowerCase();

    const project=await Project.findById(projectId);
    if(!project) throw new ApiError(404,"Workspace not found");

    // RBAC Guard
    if(project.owner.toString()!==req.user._id.toString()) throw new ApiError(403,"Forbidden: Only the project owner can issue team invitations");

    // if user already has an acount, make sure they arent already a member 
    const targetUser=await User.findOne({email:emailClean});
    if(targetUser){
        const isAlreadyMember=project.members.includes(targetUser._id);
        if(isAlreadyMember) throw new ApiError(400,"This user is already a member of this project");
    }

    // check for active "Pending" invitation to prevent duplicate spam
    const existingInvite=await Invitation.findOne({
        project:projectId,
        inviteeEmail:emailClean,
        status:"Pending"
    });

    if(existingInvite) throw new ApiError(400,"An active invitation has already been sent to this email address");

    const invitation= await Invitation.create({
        project:projectId,
        inviter:req.user._id,
        inviteeEmail:emailClean,
        status:"Pending"
    });

    // IF USER EXISTS ON PLATFORM, SEND IN-APP NOTIFICATION
    if (targetUser) {
        await sendNotification({
            recipients: targetUser._id, // The target user account found
            senderId: req.user._id,    // The project owner
            type: "PROJECT_INVITE",
            message: `You've been invited to join the project workspace: "${project.name}" by ${req.user.username}`,
            projectId: project._id
        });
    }

    // background side-effect: dispatch workspace invitation email
    // we deliberately NOT USE 'await' here because we want this running in the background without blocking the client's HTTP JSON response
    sendEmail({
        toEmail:emailClean,
        subject:` You've been invited to join ${project.title} on CollabHub!`,
        htmlContent:`
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #4F46E5; text-align: center;">CollabHub Invitation</h2>
                <p>Hello,</p>
                <p>Great news! <strong>${req.user.username}</strong> (<em>${req.user.email}</em>) has invited you to collaborate on their project workspace: <strong>"${project.name}"</strong>.</p>
                <blockquote><em>"${project.description || 'No description provided.'}"</em></blockquote>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:5173/dashboard/invitations" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Review Invitation Dashboard</a>
                </div>
                <p style="font-size: 12px; color: #666; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                    This is an automated operational notification from CollabHub. If you were not expecting this request, you can safely disregard this message.
                </p>
            </div>
        `
    });

    return res
    .status(201)
    .json(new ApiResponse(201,invitation,`Invitation securely logged for ${emailClean}`));
});

export const getMyPendingInvitations = asyncHandler(async(req,res)=>{
    const invitations=await Invitation.find({
        inviteeEmail:req.user.email,
        status:"Pending"
    })
    .populate("project","title description")
    .populate("inviter","username email avatar");

    return res
    .status(200)
    .json(new ApiResponse(200,invitations,"Pending invitations retrieved successfully"));
});

export const respondToinvitation=asyncHandler(async(req,res)=>{
    const {invitationId}=req.params;
    const {action}=req.body; // Expects either "Accepted" or "Declined"
    if(!["Accepted","Declined"].includes(action)) throw new ApiError(400,"Invalid action. System only accepts 'Accepted' or 'Declined'.");

    const invitation=await Invitation.findById(invitationId);
    if(!invitation) throw new ApiError(404,"Invitation record not found");

    // security check
    if(invitation.inviteeEmail!==req.user.email) throw new ApiError(403,"Unauthorized: This invitation does not belong to your account");

    // prevent reprocessing of closed invitations
    if(invitation.status!=="Pending"){
        throw new ApiError(400,`This invitation was already processed as ${invitation.status}`);
    }

    invitation.status=action;
    await invitation.save();

    // Variable to track the project metadata for our notification message
    let projectDetails = null;

    if(action==="Accepted"){
        projectDetails=await Project.findByIdAndUpdate(
            invitation.project,
            {
                $addToSet:{members:req.user._id} // atomic operator prevents double push bugs
            }
        );
    }
    else {
        // If declined, simply look up the project to grab its name for the alert message
        projectDetails = await Project.findById(invitation.project);
    }

    // ALERT THE PROJECT OWNER ABOUT THE RESPONSE
    if (projectDetails) {
        await sendNotification({
            recipients: invitation.inviter, // The owner who sent the original invite
            senderId: req.user._id,        // The current logged-in user responding
            type: "PROJECT_INVITE",        // Keeps it contextual to the invitation lifecycle
            message: `${req.user.username} has ${action.toLowerCase()} your invitation to join workspace: "${projectDetails.name || "Workspace"}"`,
            projectId: invitation.project
        });
    }

    return res
    .status(200)
    .json(new ApiResponse(200,invitation,`Invitation has been successfully ${action.toLowerCase()}`));
});