import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";

const app=express();

// .use is for express middleware 

// 1.Basic Security Headers (Helps shield against XSS attacks)
app.use(helmet());

// 2.Cross-Origin Resource Sharing Configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true // Let the browser automatically allow cookies with requests
}));

// 3.Built-in Parsing Middlewares

// body parses with safety size limits (16kb to prevent payload attacks)
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended:true, limit:"16kb"})); // If you receive data in URL-encoded form format, convert it into a JavaScript object and put it in req.body

// Configure local static folder (vital for Multer's temporary file storage)
// if someone asks for file from public i'll send it directly without processing anything
app.use(express.static("public"));

app.use(cookieParser());

// 4.Data Sanitization Layer (Intercepts objects with malicious MongoDB operators like '$' or '.')

// app.use(mongoSanitize({
//     replaceWith:"_"
// })
// );

// 5. Global Rate Limiter Guard (Prevents script-based spam attacks)
const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 150, // Limit each IP address to 150 requests per window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: "Too many requests from this device, please try again after 15 minutes."
});


// =========================================================================
// ROUTE DECLARATIONS
// =========================================================================
import userRouter from "../routes/user.route.js";

// this mounts our router. The full URL will become http://localhost:5000/api/v1/users/register
app.use("/api/v1/users",userRouter);

import projectRouter from "../routes/project.route.js";
app.use("/api/v1/projects",projectRouter);

import invitationRouter from "../routes/invitation.route.js";
app.use("/api/v1/invitations",invitationRouter);

import taskRouter from "../routes/task.route.js";
app.use("/api/v1/tasks",taskRouter);

import commentRouter from "../routes/comment.route.js";
app.use("/api/v1/comments",commentRouter);

import notificationRouter from "../routes/notification.route.js";
app.use("/api/v1/notifications",notificationRouter);

import aiRouter from "../routes/ai.route.js";
app.use("/api/v1/ai",aiRouter);


// 6.To ensure your custom ApiError format is always delivered cleanly to the frontend without crashing your node app on edge cases, ensure you have an active global error handling middleware

// Global error handling middleware (must accept 4 arguments)
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log details internally for the development team
    console.error(`[Error Engine] Encountered: ${message}`);
    if (err.stack && process.env.NODE_ENV !== "production") {
        console.error(err.stack);
    }

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        // Hide stack trace vectors from production end-users
        errors: err.errors || [],
        stack: process.env.NODE_ENV === "production" ? null : err.stack
    });
});


export {app};