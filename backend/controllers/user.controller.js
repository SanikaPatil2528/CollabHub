import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {User} from "../models/user.model.js";
import {Invitation} from "../models/invitation.model.js";
import {Project} from "../models/project.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


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