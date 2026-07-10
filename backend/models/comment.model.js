import mongoose, {Schema} from "mongoose";

const commentSchema = new Schema(
    {
        project:{
            type:Schema.Types.ObjectId,
            ref:"Project",
            required:[true,"Parent projectId is required"]
        },
        content:{
            type:String,
            required:[true,"Comment content cannot be empty"],
            trim:true
        },
        task:{
            type:Schema.Types.ObjectId,
            ref:"Task",
            default:null
        },
        author:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        editedAt:{
            type:Date,
            default:null
        }
    },
    {
        timestamps: true
    }
);


export const Comment=mongoose.model("Comment",commentSchema);