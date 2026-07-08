import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const userSchema = new Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true  // Optimized for high-performance searching
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true
        },
        fullName:{
            type:String,
            required:true,
            trim:true
        },
        avatar:{
            type:String, // cloudinary url
            required:true
        },
        password:{
            type:String,
            required: [true,"Password is required"],
            validate:{
                validator: isPasswordValid,
                message: "Password must be atleast 8 characters long and contain atleast one uppercase letter, one lowercase letter, ans one number."
            }
        },
        refreshToken:{
            type:String
        },
        skills:{
            type: [String],
            default:[]
        },
        bio:{
            type:String,
            trim:true,
            default:""
        }
    },
    {
        timestamps:true
    }
);

function isPasswordValid(password){
    // min 8 chars, 1 uppercase,1 lowercase,1 number
    if(!password || password.length<8) return false;
    let hasUpper=false;
    let hasLower=false;
    let hasNumber=false;

    for(let i=0;i<password.length;i++){
        const char=password[i];
        if(char>='0' && char<='9') hasNumber=true;
        // uppercase and not a symbol
        else if(char===char.toUpperCase() && char!==char.toLowerCase()) hasUpper=true;
        else if(char===char.toLowerCase() && char!==char.toUpperCase()) hasLower=true;
    }

    return hasUpper && hasLower && hasNumber;
}


// Hook to hash password right before saving to mongoDB

userSchema.pre("save",async function(){
    if(!this.isModified("password")) return ;
    this.password= await bcrypt.hash(this.password,10); // 10-> salt(rounds of hashing)
});

// custom method to validate plain text password against database hashed password

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password,this.password);
};


userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken= function(){
    return jwt.sign({
        _id:this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
);
};


export const User= mongoose.model("User",userSchema);