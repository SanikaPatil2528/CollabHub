import mongoose,{Schema} from "mongoose";

const taskSchema = new Schema(
    {
        title:{
            type:String,
            required:[true,"Task title is required"],
            trim:true
        },
        description:{
            type:String,
            required:[true,"Task description is required"],
            trim:true
        },
        assignedTo:[
            {
                type:Schema.Types.ObjectId,
                ref:"User"
            }
        ],
        status:{
            type:String,
            enum:{
                values:["To-Do","In-Progress","Review","Done"],
                message: "{VALUE} is not a valid task status"
            },
            default: "To-Do"
        },
        priority:{
            type:String,
            enum:{
                values:["Low","Medium","High","Critical"],
                message: "{VALUE} is not a valid priority level"
            },
            default:"Medium"
        },
        dueDate:{
            type:Date
        }
    },
    {
        timestamps:true
    }
)


export const Task=mongoose.model("Task",taskSchema);