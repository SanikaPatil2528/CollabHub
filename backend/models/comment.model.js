import mongoose, {Schema} from "mongoose";

const commentSchema = new Schema(
    {
        content:{
            type:String,
            required:[true,"Comment content cannot be empty"],
            trim:true
        },
        project:{
            type:Schema.Types.ObjectId,
            ref:"Project",
            required:true
        },
        task:{
            type:Schema.Types.ObjectId,
            ref="Task"
        },
        author:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true
        }
    },
    {
        timestamps: true
    }
);


export const Comment=mongoose.model("Comment",commentSchema);