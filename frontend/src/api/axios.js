import axios from "axios";

// read the base URL straight from .env.development file
const baseURL=import.meta.env.VITE_API_BASE_URL || "https://localhost:8000/api/v1";

const axiosInstance=axios.create({
    baseURL,
    // allows browser to securely send and receive HTTP-Only cookies/JWTs
    withCredentials:true,
    headers:{
        "Content-Type":"application/json",
    },
});

// Response Interceptor: Catches errors globally before they hit your component code
axiosInstance.interceptors.response.use(
    // success function
    (response)=>response,
    // error function
    async(error)=>{
        const originalRequest=error.config;

        // if backend returns a 401 unauthorized, it means your access token expired
        if (error.response?.status===401 && !originalRequest._retry){
            originalRequest._retry=true;

            try {
                // trigger your backend's refreshAccessToken endpoint automatically
                await axios.post(`${baseURL}/users/refresh-token`,{},{withCredentials:true});

                // retry the original request that failed now that the cookie is renewed
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // if refreshing fails, the refresh token is expired or missing
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;