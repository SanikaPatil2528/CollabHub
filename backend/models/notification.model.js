import mongoose,{Schema} from "mongoose";

const notificationSchema = new Schema(
    {
        recipient:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        sender:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        type:{
            type:String,
            required:true,
            enum:{
                values: ["TASK_ASSIGNED","NEW_COMMENT","PROJECT_INVITE","SYSTEM"],
                message:"{VALUE} is not a supported notification type"
            }
        },
        message:{
            type:String,
            required:[true,"Notification message content is required"],
            trim:true
        },
        isRead:{
            type:Boolean,
            default:false
        },
        project:{
            type:Schema.Types.ObjectId,
            ref="Project" // Optional link to redirect the user to correct workspace
        },
        task:{
            type:Schema.Types.ObjectId,
            ref="Task" // Optional link to direct the user straight to the task card
        }
    },
    {
        timestamps: true
    }
);

// Indexing recipient for fast query performance when loading a user's notification feed
notificationSchema.index({recipient:1,isRead:1});

/*
Imagine you have a massive textbook containing 1,000,000 notifications from every user on the app.

Without an Index (Table Scan): Every single time a specific user logs in and wants to see their unread notifications, MongoDB has to open that textbook and read every single page from start to finish just to look for notifications that belong to them and are marked false for isRead. If you have millions of rows, your app becomes incredibly slow.

With a Compound Index: The line notificationSchema.index({ recipient: 1, isRead: 1 }); tells MongoDB to maintain a hidden, perfectly sorted "index page" at the back of the textbook. This index is automatically sorted first by recipient ID, and then grouped by whether isRead is true or false.

Now, when a user logs in, MongoDB doesn't scan the database. It jumps straight to that user's section in the index, grabs only their unread notifications instantly, and ignores everything else. The 1 just means sort them in ascending order.
*/ 

export const notificationSchema= mongoose.model("Notification",notificationSchema);