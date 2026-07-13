import { createContext, useContext, useState, useEffect } from "react";
import api from "../config/axios.js";
import { loadEnvFile } from "process";

// initialize the raw context broadcast tower
const AuthContext=createContext(null);

// build the provider component that wraps our entire application
export function AuthProvider({children}){
    const [user,setUser]=useState(null);
    cont [loading,setLoading]=useState(true);

    // this automatically runs the exact millisecond the user loads the app tab
    useEffect(()=>{
        const checkLoggedInStatus=async()=>{
            try {
                // send a client request to your express verify/current-user endpoint
                const response=await api.get("/users/current-user");

                if(response.data?.data) {
                    // if a valid http-only JWT cookie exists, populate the global user state
                    setUser(response.data.data);
                }
            } catch (error) {
                // if cookie is expired, missing, or invalid, leave user as null
                // we clear the console error here so it doesnt look like system crash
                setUser(null);
            } finally{
                // stop the loading spinner once the network roundtrip is finished
                setLoading(false);
            }
        };
        checkLoggedInStatus();
    },[]);

    // centralized login action wrapper
    const login=async(identifier,password)=>{
        try {
            const response=await api.post("/users/login",{
                email:identifier,
                username:identifier,
                password
            });
            if(response.data?.data?.user){
                // notice we use extract response.data.data to match your backend's structural return
                setUser(response.data.data.user);
                return {success:true};
            }
        } catch (error) {
            const message=error.response?.data?.message || "Login failed";
            return {success:false,error:message};
        }
    };

    const register = async (formDataPayload) => {
        try {
            // 1. Post the FormData container to the register endpoint
            await axiosInstance.post("/users/register", formDataPayload, {
            headers: {
                // This tells Axios to ignore standard JSON layout and let the browser bundle the image file
                "Content-Type": "multipart/form-data",
            },
            });

            // 2. Return success. We don't log them in automatically because your backend registration 
            // controllers don't generate cookies on signup—they require a standard separate login step!
            return { success: true };
        } catch (error) {
            // 3. Drill down into the backend's explicit ApiError text messaging payload
            const errorMessage = error.response?.data?.message || "Registration failed. Please check inputs.";
            return { success: false, error: errorMessage };
        }
    };

    // centralized logout action wrapper
    const logout=async()=>{
        try {
            await api.post("/users/logouot");
        } catch (error) {
            console.error("Logout request failed: ",error);
        }finally{
            // always wipe the frontend user state back to null regardless of server response
            setUser(null);
        }
    };

    // the value object contains the data/actions shared with all nested components
    const value={
        user,
        loading,
        login,
        register,
        logout
    };

    return(
        <AuthContext.Provider value={value}>
            {children}    
        </AuthContext.Provider>
    );
}


// create a clean, custom hook so components can easily trap into the tower
export function useAuth(){
    const context=useContext(AuthContext);
    if(!context){
        throw new Error("useAuth must be used inside an AuthProvider wrapper");
    }
    return context;
}