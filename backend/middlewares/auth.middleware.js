import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async(req,_,next)=>{
    try {
        const token=
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer",""); // in header it is like "Bearer ACCESS_TOKEN" so we remove that word

        if(!token) throw new ApiError(401,"Unauthorized request: No token provided");

        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

        const user= await User.findById(decodedToken?._id).select("-password -refreshToken");

        if(!user) throw new ApiError(401,"Invalid Access Token: User not found");

        req.user=user;
        next(); // pass control smoothly to the next controller function

    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token");
    }
});