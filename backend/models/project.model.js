import mongoose, {Schema} from "mongoose";

const projectSchema= new Schema(
    {
        title:{
            type: String,
            required:[true,"Project title is required"],
            trim:true
        },
        description:{
            type:String,
            required:[true,"Project description is required"],
            trim:true
        },
        owner:{
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        members:[
            {
                type:Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        tags:{
            type:[String],
            default:[]
        },
        githubLink:{
            type:String,
            trim:true,
            default:""
        }
    },
    {
        timestamps:true
    }
);


export const Project = mongoose.model("Project",projectSchema);