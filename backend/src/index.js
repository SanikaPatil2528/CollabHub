import "dotenv/config";

import connectDB from "../db/index.js";
import { app } from "./app.js";

connectDB()
.then(()=>{
    const PORT=process.env.PORT || 5000;
    // start listening server only after the database connection is secure
    app.listen(PORT,()=>{
        console.log(`Server is running at port: ${PORT}`);
    });
})
.catch((err)=>{
    console.log("MONGO DB connection failed! ",err);
})