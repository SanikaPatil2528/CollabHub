import {useState} from "react";
import {Link,useNavigate} from "react-router-dom"

export default function Login(){
    const {login}=useAuth();
    const navigate=useNavigate();

    // Local Form states
    const [identifier,setIdentifier]=useState("");
    const [password,setPassword]=useSate("");
    const [error,setError]=useState("");
    const [isSubmitting,setisSubmitting]=useState(false);

    const handleSubmit=async(e)=>{
        e.preventDefault();
        setError("");
        setisSubmitting(true);

        const result=await login(identifier,password);
        setisSubmitting(false);

        if(result.success){
            // send the authenticated user directly into the protected workspace shell
            navigate("/dashboard");
        }else setError(result.error);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-xl">
            
            {/* Header / Brand */}
            <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-500 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">Welcome Back</h2>
            <p className="text-sm text-zinc-400 mt-1">Sign in to access your workspace dashboard</p>
            </div>

            {/* Error Feedback Banner */}
            {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-400 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
            </div>
            )}

            {/* The Interaction Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
            
                {/* Username or Email Single Input */}
                <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Username or Email
                    </label>
                    <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. johndoe or john@example.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-500 transition-colors duration-200 disabled:opacity-50"
                    />
                </div>

                {/* Password Input */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Password
                    </label>
                    </div>
                    <input
                    type="password"
                    required
                    disabled={isSubmitting}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-500 transition-colors duration-200 disabled:opacity-50"
                    />
                </div>

                {/* Form Actions Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold rounded-lg py-2.5 transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                    <>
                        <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing In...</span>
                    </>
                    ) : (
                    <span>Sign In</span>
                    )}
                </button>
                
            </form>

            {/* Dynamic Route Switching Footer */}
            <div className="mt-6 text-center text-sm text-zinc-500">
            Don't have an account yet?{" "}
            <Link to="/register" className="text-emerald-500 hover:underline transition-all font-medium">
                Create an account
            </Link>
            </div>

        </div>
        </div>
    );
}