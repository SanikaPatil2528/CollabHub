import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register(){
    const {register} = useAuth();
    const navigate=useNavigate();

    // Core Account States
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // Metadata & Profile States
    const [bio, setBio] = useState("");
    const [skills, setSkills] = useState("");
    const [avatarFile, setAvatarFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");

    // Feedback Tracking States
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // File Picker Interactive State Handler
    const handleFileChange=(e)=>{
        const file=e.target.files[0];
        if(file){
            setAvatarFile(file);
            // generate a temporary local browser RAM url to preview the picture instantly
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit=async(e)=>{
        e.preventDefault();
        setError("");

        if(!avatarFile){
            setError("An avatar profile picture file is strictly required.");
            return;
        }

        setIsSubmitting(true);

        // Operational Alignment: Instantiate a multipart FormData envelope
        const formData = new FormData();
        formData.append("fullName", fullName);
        formData.append("email", email);
        formData.append("username", username);
        formData.append("password", password);
        formData.append("bio", bio);
        formData.append("skills", skills);
        formData.append("avatarLocalPath", avatarFile); // Key name MUST match your backend upload.single("avatar")

        const result = await register(formData);
        setIsSubmitting(false);

        if (result.success) {
        // Send them straight to login or auto-login them depending on preference
        navigate("/login");
        } else {
        setError(result.error);
        }

    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
            <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-xl">
                
                {/* Header Block */}
                <div className="mb-8 border-b border-zinc-800 pb-5">
                <h2 className="text-2xl font-bold text-zinc-100">Create Workspace Account</h2>
                <p className="text-sm text-zinc-400 mt-1">Set up your engineering credentials and profile metadata</p>
                </div>

                {/* Error Feedback Alert Banner */}
                {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-sm text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                </div>
                )}

                {/* Interactive Registration Form Layout */}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                    {/* LEFT COLUMN: Visual Profile Customization */}
                    <div className="space-y-5 flex flex-col justify-start">
                        
                        {/* Avatar File Input Custom Trigger Block */}
                        <div className="flex flex-col items-center p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-center">
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                            Profile Avatar Picture
                        </label>
                        
                        <div className="relative w-28 h-28 rounded-full border-2 border-dashed border-zinc-700 bg-zinc-900 flex items-center justify-center overflow-hidden mb-4 group hover:border-emerald-500 transition-colors">
                            {previewUrl ? (
                            <img src={previewUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                            ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-zinc-600 group-hover:text-emerald-500 transition-colors">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                            </svg>
                            )}
                        </div>
                        
                        <input
                            type="file"
                            id="avatar-picker"
                            accept="image/*"
                            required
                            disabled={isSubmitting}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <label
                            htmlFor="avatar-picker"
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-all inline-block"
                        >
                            Choose Image File
                        </label>
                        </div>

                        {/* Profile Bio Field */}
                        <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                            Developer Bio
                        </label>
                        <textarea
                            disabled={isSubmitting}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about your engineering focus, experience, or background..."
                            rows={4}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 placeholder-zinc-700 outline-none focus:border-emerald-500 transition-colors resize-none disabled:opacity-50"
                        />
                        </div>

                        {/* Skills String Field */}
                        <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                            Skills (Comma Separated)
                        </label>
                        <input
                            type="text"
                            disabled={isSubmitting}
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            placeholder="e.g. React, Node.js, TypeScript, Docker"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 placeholder-zinc-700 outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                        />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Mandatory Account Authentication Credentials */}
                    <div className="space-y-5 flex flex-col justify-between">
                        <div className="space-y-5">
                        {/* Full Name Input */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                            Full Name
                            </label>
                            <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 placeholder-zinc-700 outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                            />
                        </div>

                        {/* Email Input */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                            Email Address
                            </label>
                            <input
                            type="email"
                            required
                            disabled={isSubmitting}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 placeholder-zinc-700 outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                            />
                        </div>

                        {/* Username Input */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                            Username
                            </label>
                            <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="johndoe123"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 placeholder-zinc-700 outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                            Password
                            </label>
                            <input
                            type="password"
                            required
                            disabled={isSubmitting}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 placeholder-zinc-700 outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                            />
                        </div>
                        </div>

                        {/* Submissions Execution Block placed cleanly at bottom right */}
                        <div className="pt-4 border-t border-zinc-800 md:border-none md:pt-0">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold rounded-lg py-3 transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                                <span>Processing Registration...</span>
                            </>
                            ) : (
                            <span>Register Account</span>
                            )}
                        </button>

                        <div className="mt-4 text-center text-sm text-zinc-500">
                            Already have an account?{" "}
                            <Link to="/login" className="text-emerald-500 hover:underline transition-all font-medium">
                            Sign in here
                            </Link>
                        </div>
                        </div>

                    </div>
                    
                </form>

            </div>
        </div>
    );
}