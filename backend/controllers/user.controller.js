import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { Task } from "../models/task.model.js";
import { Comment } from "../models/comment.model.js";
import { Invitation } from "../models/invitation.model.js";
import { Notification } from "../models/notification.model.js";


export const registerUser = asyncHandler(async(req,res)=>{
    console.log("registerUser controller reached");
    const {username, email, fullName, password, bio, skills}=req.body;

    if (
        [username, email, fullName, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "Username, email, fullName, password, and avatar are strictly required.");
    }

    const avatarLocalPath = req.file?.path;
    console.log("FILE:", req.file);
    console.log("PATH:", avatarLocalPath);
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image file is strictly required.");
    }

    const existedUser = await User.findOne({
        $or: [{username},{email}]
    });

    if(existedUser) throw new ApiError(409,"User with this email or username already exists");

    const cloudinaryResponse = await uploadOnCloudinary(avatarLocalPath);

    if (!cloudinaryResponse || !cloudinaryResponse.url) {
        throw new ApiError(500, "Failed to upload avatar to Cloudinary. Please try again.");
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        fullName,
        password,
        avatar:cloudinaryResponse.url, // Saved as a string url
        bio,    // Defaults to "" if not sent
        skills  // Defaults to [] if not sent
    });

    const createdUser=await User.findById(user._id).select("-password");
    if(!createdUser) throw new ApiError(500,"Something went wrong while registering the user");

    // =========================================================================
    // THE COLLABORATION FEATURE: Link Pending Workspace Invitations
    // =========================================================================

    // check if anyone invited this email address to a project before they registered
    const pendingInvitesCount = await Invitation.countDocuments({
        inviteeEmail: createdUser.email,
        status: "Pending"
    });

    return res
    .status(201)
    .json(new ApiResponse(
        201,
        {user: createdUser,pendingInvitesCount},
        "User registered successfully. Head to your dashboard to view pending invitations!"
    ));
})

const generateAccessAndRefreshTokens=async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();

        // save the refresh token to the database to keep track of valid active sessions
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave : false});

        return {accessToken, refreshToken};
    } catch (error) {
        console.error("Token generation error:", error);
        throw error;
    }
}

export const loginUser= asyncHandler(async(req,res)=>{
    const {email,username,password} = req.body;
    if(!email && !username) throw new ApiError(400,"Username or email is required");

    const user=await User.findOne({
        $or: [{email:email?.toLowerCase()}, {username: username?.toLowerCase()}]
    });
    if(!user) throw new ApiError(404,"User does not exist");

    const isPasswordValid= await user.isPasswordCorrect(password);
    if(!isPasswordValid) throw new ApiError(401,"Invalid user credentials");

    // Issue fresh tokens
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id);
    const loggedInUser= await User.findById(user._id).select("-password -refreshToken");

    // Configure secure cookies
    const options={
        httpOnly: true, // cookie cant be accessed by js running in browser -- safeguards against malicious XSS cross-site scripting attacks
        secure: process.env.NODE_ENV==="production", // Enforces https usage in production else http in development
        sameSite: "strict" // this controls when browser sends cookies to other websites -- "strict" browser sends cookies only when request originates from your own site
    }

    return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(
                200,
                {user:loggedInUser,accessToken,refreshToken},
                "User logged in successfully"
            )
        );
});

export const logoutUser=asyncHandler(async(req,res)=>{
    // we use our verifyJWT middleware, so req.user._id is completely accessible here
    await User.findByIdAndUpdate(
        req.user._id,
        {
            // instead of making refresToken as "", we use unset to completely remove the field entry out of MongoDB, ensuring broken or malicious reuse attempts crash instantly
            $unset:{
                refreshToken:1
            }
        },
        {new:true} // sends back new values after updated
    );

    const options={
        httpOnly:true,
        secure:process.env.NODE_ENV==="production",
        sameSite:"strict"
    };

    // wipe out client cookies explicitly
    return res
        .status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json(new ApiResponse(200,{},"User logged out successfully"));
});

export const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken) throw new ApiError(401,"Unauthorized request: No refresh token provided");

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user=await User.findById(decodedToken?._id);
        if(!user) throw new ApiError(401,"Invalid Refresh token");

        if(incomingRefreshToken!==user.refreshToken) throw new ApiError(401,"Refresh token is expired or already used");

        // generate new tokens (Refresh token rotation)
        const {accessToken, refreshToken: newRefreshToken}=await generateAccessAndRefreshTokens(user._id);

        const options={
            httpOnly:true,
            secure: process.env.NODE_ENV==="production",
            sameSite:"strict"
        }

        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access token refreshed successfully"
            )
        );
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token");
    }
});

export const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,bio,skills}=req.body;
    if(!fullName || fullName.trim()==="") throw new ApiError(400,"Full name is required");

    // since this is a protected route, req.user is guaranteed by verifyJWT middleware
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                bio: bio || "",
                skills: Array.isArray(skills) ? skills: []
            }
        },
        {new :true} // returns the modified document instead of the old one
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Account details updated succcessfully"
    ));
});

export const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path;
    if(!avatarLocalPath) throw new ApiError(400,"Avatar file is missing");

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url) throw new ApiError(500,"Error while uploading avatar to cloud server");

    const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password -refreshToken");

    /* 💡 Production Note: In a real-world app, you should write a cleanup hook 
       here using `cloudinary.v2.uploader.destroy()` to delete the user's *old* profile image 
       so your cloud storage asset count doesn't overflow with junk data.
    */

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar image updated successfully"
        )
    );
});

export const getCurrentUser = asyncHandler(async(req,res)=>{
    // because verifyJWT already fetched the user object, we dont need a DB query here
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully"
        )
    );
});

export const deleteUserAccount= asyncHandler(async(req,res)=>{
    const userId=req.user._id;
    const userEmail=req.user.email;

    console.log(`[Account Teardown] Beginning absolute purge for user: ${req.user.username}`);

    // 1. Find all projects completely owned by this user
    const ownedProjects = await Project.find({ owner: userId });
    const ownedProjectIds = ownedProjects.map(proj => proj._id);

    // 2.RUN BULK CASCADING TEARDOWN (Parallel execution for maximum performance)
    await Promise.all([
        // --- CASE A: Wiping everything connected to projects they owned ---
        Task.deleteMany({ project: { $in: ownedProjectIds } }),
        Comment.deleteMany({ project: { $in: ownedProjectIds } }),
        Invitation.deleteMany({ project: { $in: ownedProjectIds } }),
        Notification.deleteMany({ project: { $in: ownedProjectIds } }),
        Project.deleteMany({ owner: userId }), // Drops the parent project hubs

        // --- CASE B: Cleaning up their footprint in shared project hubs ---
        // Pull their ID out of any project workspace members arrays where they were a contributor
        Project.updateMany(
            { members: userId },
            { $pull: { members: userId } }
        ),
        
        // Remove their ID from any task card assignees arrays across the entire app
        Task.updateMany(
            { assignedTo: userId },
            { $pull: { assignedTo: userId } }
        ),

        // Clean out all workspace invitations sent to or sent from this user's email
        Invitation.deleteMany({
            $or: [
                { inviteeEmail: userEmail },
                { sender: userId }
            ]
        }),

        // Permanently drop their personal notification inbox stream
        Notification.deleteMany({ recipient: userId })
    ]);

    console.log(`[Account Teardown] Shared ecosystems decoupled. Deleting primary profile.`);

    // Clear out the User record and security tokens from the database
    await User.findByIdAndDelete(userId);

    // Securely clear client-side HTTP-Only authentication cookies
    const cookieOptions = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new ApiResponse(
                200, 
                {}, 
                "Your profile account and all associated managed workspaces have been permanently purged."
            )
        );
});

export const searchUsersByUsername = asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim() === "") {
        return res
            .status(200)
            .json(new ApiResponse(200, [], "No query string provided."));
    }

    // 2. Query matching profiles by username (case-insensitive)
    // Exclude the current logged-in user from the search list
    const matchingUsers = await User.find({
        username: { $regex: q.trim(), $options: "i" },
        _id: { $ne: req.user._id } 
    })
    .select("username email fullName avatar bio skills")
    .limit(10); // Boundary cap to prevent massive database reads

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                matchingUsers,
                "Matching team members retrieved successfully."
            )
        );
});