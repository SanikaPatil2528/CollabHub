import multer from "multer";

// configure disk storage settings for multer
const storage=multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, "./public/temp");
    },
    // keep the file's original name as it is
    filename: function(req,file,cb){
        cb(null,file.originalname);
    }
});

// export the configured upload middleware instance
export const upload = multer({
    storage,
});