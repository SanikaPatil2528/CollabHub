import mongoose,{Schema} from "mongoose";

const invitationSchema = new Schema(
    {
        project:{
            type:Schema.Types.ObjectId,
            ref="Project",
            required:true
        },
        inviter:{
            type:Schema.Types.ObjectId,
            ref="User",
            required:true
        },
        inviteeEmail:{
            type:String,
            required:true,
            trim:true,
            lowercase:true
        },
        status:{
            type:String,
            enum:{
                values:["Pending","Accepted","Declined"],
                message:"{VALUE} is not a valid invitation status"
            },
            default: "Pending"
        }
    },
    {
        timestamps:true
    }
);

// Indexing email for blazing fast lookups when a user opens their "Pending Invites" dashboard
invitationSchema.index({inviteeEmail:1,status:1});

export const Invitation=mongoose.model("Invitation",invitationSchema);