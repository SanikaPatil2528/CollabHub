import mongoose from "mongoose"
import { DB_NAME } from "../src/constants"

const connectDB=async()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected! DB HOST: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.error("MONGODB connection FAILED: ",error);
        process.exit(1); // Safely shuts down the app with a failure status code
    }
}

export default connectDB;