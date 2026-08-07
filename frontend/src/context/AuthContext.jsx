import { createContext,useContext,useState,useEffect } from "react";
import axiosInstance from "../api/axios.js";
import { UNSAFE_ErrorResponseImpl } from "react-router-dom";
import axios from "axios";

const AuthContext=createContext(null);

export function AuthProvider({children}){
    const [user,setUser]=useState(null);
    const [isLoading,setIsLoading]=useState(true);
    const [error,setError]=useState("");

    // run an application mount to check for active HTTP-Only cookie sessions
    useEffect(()=>{
        const checkAuthSession=async()=>{
            try {
                // maps to backend's getCurrentUser controller
                const response=await axiosInstance.get("/users/current-user");
                setUser(response.data?.data || response.data || null);
            } catch (error) {
                //quietly fail if unauthorized; the interceptor handled refresh attempts already
                setUser(null);
            } finally{
                setIsLoading(false);
            }
        };
        checkAuthSession();
    },[]);

    // 1.Register action handler
    const register=async(formData)=>{
        setError("");
        try {
            // uses raw formData instead of json to securely pass cloudinary avatar file stream
            const response=await axiosInstance.post("/users/register",formData,{
                headers: {"Content-Type":"multipart/form-data"},
            });
            return response.data;
        } catch (err) {
            const errMsg=err.response?.data?.message || "Registration failed";
            setError(errMsg);
            throw new Error(errMsg);
        }
    };

    // 2.Login action handler
    // identifier -> email/username
    const login=async(identifier,password)=>{
        setError("");
        try {
            // maps to loginUser - sets access and refresh tokens via secure HTTP-only cookies
            const response=await axiosInstance.post("/users/login",{
                email:identifier,
                username:identifier,
                password
            });
            const userData=response.data?.data || response.data;
            setUser(userData);
        } catch (err) {
            const errMsg=err.response?.data?.message || "Invalid user credentials";
            setError(errMsg);
            throw new Error(errMsg);
        }
    };

    // 3.Logout action handler
    const logout = async()=>{
        try {
            // maps to logoutUser- clears backend tracking token and client-side cookie arrays
            await axiosInstance.post("/users/logout");
        } catch (err) {
            console.error("Server-side session clear failed: ",err);
        } finally{
            // always tear down local state visibility regardless of network response
            setUser(null);
        }
    };

    // 4.Update Profile details handler
    const updateProfile=async(details)=>{
        try {
            // maps to updateAccountDetails 
            const response=await axiosInstance.patch("/users/update-account",details);
            const updatedUser=response.data?.data || response.data;
            setUser(updatedUser);
        } catch (err) {
            const errMsg=err.response?.data?.message || "Failed to update profile details";
            setError(errMsg);
            throw new Error(errMsg);
        }
    };

    // 5. Update Avatar Picture Handler
    const updateAvatar = async (formData) => {
        setError("");
        try {
        // Sends the multipart file stream directly to your backend avatar controller
        const response = await axiosInstance.patch("/users/update-avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        
        const updatedUser = response.data?.data || response.data;
        setUser(updatedUser); // Update local state with the new Cloudinary image URL
        return updatedUser;
        } catch (err) {
        const errMsg = err.response?.data?.message || "Failed to update avatar image.";
        setError(errMsg);
        throw new Error(errMsg);
        }
    };

    // 6. Delete Account Handler
    const deleteAccount = async () => {
        setError("");
        try {
        // Fires the removal command to your backend controller
        await axiosInstance.delete("/users/delete-account");
        } catch (err) {
        const errMsg = err.response?.data?.message || "Failed to delete your account resource.";
        setError(errMsg);
        throw new Error(errMsg);
        } finally {
        // Always wipe local authentication state so they can't access protected routes
        setUser(null);
        }
    };

    // 7. search user
    const searchUser = async (username) => {
        setError("");
        try {
            // Change the key here from 'username' to 'q' to match your controller
            const response = await axiosInstance.get("/users/search", {
                params: { q: username } 
            });
            return response.data?.data || response.data;
        } catch (err) {
            const errMsg = err.response?.data?.message || "User search operation failed.";
            setError(errMsg);
            throw new Error(errMsg);
        }
    };

    const value={
        user,
        isLoading,
        error,
        register,
        login,
        logout,
        updateProfile,
        setError,
        updateAvatar,
        deleteAccount,
        searchUser
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// custom hook for seamless context access across view subcomponents
export function useAuth(){
    const context=useContext(AuthContext);
    if(!context) throw new Error("useAuth must be executed within AuthProvider hierarchy");
    return context;
}