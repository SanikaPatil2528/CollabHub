import mongoose,{Schema} from "mongoose";

const taskSchema = new Schema(
    {
        project:{
            type:Schema.Types.ObjectId,
            ref:"Project",
            required:[true,"A task must be mapped to a specific project workspace"]
        },
        createdBy:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:[true,"The user who created this task must be recorded"]
        },
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

// instead of scanning every task in database, mongoDB isolates the search to the target projects, pre-sorted by column layout
taskSchema.index({project:1,status:1});

export const Task=mongoose.model("Task",taskSchema);