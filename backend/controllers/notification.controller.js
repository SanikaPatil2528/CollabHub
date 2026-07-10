import {Notification} from "../models/notification.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

export const getUserNotifications= asyncHandler(async(req,res)=>{
    // queries databse targeting the recipient field using our compound index
    const notifications=await Notification.find({recipient:req.user._id})
        .populate("sender","username avatar")
        .populate("project","title")
        .populate("task","title")
        .sort({isRead:1,createdAt:-1}); // places unread alerts first, then orders by newest

    return res
    .status(200)
    .json(new ApiResponse(200,notifications,"Notification inbox retrieved"));
});

export const markNotificationAsRead=asyncHandler(async(req,res)=>{
    const {notificationId}=req.params;
    const notification=await Notification.findById(notificationId);
    if(!notification) throw new ApiError(404,"Target notification record could not be found");

    if(notification.recipient.toString()!==req.user._id.toString()) throw new ApiError(403,"Access Forbidden: This notification does not belong to you");

    notification.isRead=true;
    await notification.save();

    return res
        .status(200)
        .json(new ApiResponse(200,notification,"Notification marked as read"));
});

export const markAllNotificationsAsRead=asyncHandler(async(req,res)=>{
    const updateResult=await Notification.updateMany(
        {
            recipient:req.user._id,
            isRead:false
        },
        {
            $set:{isRead:true}
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {modifiedCount:updateResult.modifiedCount},
                "All unread inbox notification cleared successfully"
            )
        );
});