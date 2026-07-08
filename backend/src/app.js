import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app=express();

// .use is for express middleware 

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true // Let the browser automatically allow cookies with requests
}));

// body parses with safety size limits (16kb to prevent payload attacks)
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended:true, limit:"16kb"})); // If you receive data in URL-encoded form format, convert it into a JavaScript object and put it in req.body

// Configure local static folder (vital for Multer's temporary file storage)
// if someone asks for file from public i'll send it directly without processing anything
app.use(express.static("public"));

app.use(cookieParser());


// =========================================================================
// ROUTE DECLARATIONS
// =========================================================================
import userRouter from "../routes/user.route.js";

// this mounts our router. The full URL will become http://localhost:5000/api/v1/users/register
app.use("/api/v1/users",userRouter);


export {app};