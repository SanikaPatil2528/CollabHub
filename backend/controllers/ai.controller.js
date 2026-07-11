import {GoogleGenAI} from "@google/genai";
import {User} from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

// initialize the Google Gen AI SDK client instance
const ai=new GoogleGenAI({});

// Sanitized database fetch
export const recommendedTeamMembers = asyncHandler(async(req,res)=>{
    const {projectDescription, maxMatches=5} = req.body;
    if(!projectDescription || projectDescription.trim()==="") throw new ApiError(400,"Project description is required for AI matching.");

    // 1.fetch all users from the database, except the person making the request
    const availableUsers=await User.find({
        _id:{$ne: req.user._id}
    }).select("_id username fullname skills bio");

    // 2.Fallback check: If there are no other ussers registered yet
    if(!availableUsers || availableUsers.length===0){
        return res
            .status(200)
            .json(new ApiResponse(200,[],"No candidates available for matching at this time."));
    }

    // 3.Format the candidate data neatly so the model can digest it efficiently 
    const candidatePoolText=availableUsers.map(u=>
        `User ID: ${u._id}\nName: ${u.fullName}\nSkills: ${u.skills.join(", ") || "None Listed"}\nBio: ${u.bio || "No bio filled out."}\n---`
    ).join("\n");

    // 4.Build the strict context prompt instruction
    const matchingPrompt=`
    You are an expert technical recruiter and team composition assistant.
    Analyze the following project description and match it against the candidate pool below.
    
    Project Requirements/Description:
    "${projectDescription}"
    
    Candidate Pool:
    ${candidatePoolText}
    
    Select the top 1 to ${Number(maxMatches)} most qualified candidates whose skills or bio align with the project requirements. 
    For each selected match, provide a brief, professional one-sentence justification.
    `;

    // 5.execute the structured AI inference call
    const aiResponse=await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: matchingPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    recommendations: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                userId: {type:"STRING",description:"The exact User ID string from the pool"},
                                matchReason: {type:"STRING",description:"A precise, single-sentence reason for matching this candidate."}
                            },
                            required: ["userId","matchReason"]
                        }
                    }
                },
                required: ["recommendations"]
            }
        }
    });

    if(!aiResponse) throw new ApiError(500,"")

    // 6.Parse the verified JSON string returned by the model
    try {
        const rawResult= JSON.parse(aiResponse.text);
        // 7.deliver a structured response payload to the client
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    rawResult.recommendations || [],
                    "Team recommendations generated successfully based on project needs."
                )
            );
    } catch (error) {
        // Fallback protection: Handles internal JSON parsing exceptions smoothly
        throw new ApiError(500,"Failed to process AI recommendation format. Please try again.");
    }

});