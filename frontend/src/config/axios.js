import axios from 'import';

const api=axios.create({
    // this directs requests through your vite proxy straight to port 8000
    baseURL:'/api/v1',

    // this forces the browser to always include your secure auth cookies
    withCredentials:true,

    headers:{
        'Content-Type':'application/json',
    },
    timeout:10000, // if the backend does not respond within 10 seconds, cancel the request
});


// Interceptor checkpoint - as a middleman that catches responses from your backend before they reach your individual React components
// A quick interceptor to log network errors cleanly in the browser console
api.interceptors.response.use(
    (response)=>response,
    (error)=>{
        const errorMessage=error.response?.data?.message || "something went wrong";
        console.error("API Error Intercepted: ".{
            status:error.response?.status,
            message:errorMessage,
        });
        return Promise.reject(error);
    }
);

export default api;