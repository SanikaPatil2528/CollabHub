class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        stack=""
    ){
        super(message);
        this.statusCode=statusCode;
        this.data=null; // Standardizing that error payloads carry no operational data
        this.message=message;
        this.success=false;
        this.errors=errors;

        if(stack) this.stack=stack;
        else Error.captureStackTrace(this.customError || this,this.constructor);
    }
}

export{ApiError};