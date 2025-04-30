import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { resumeText, customKeywords = [], selectedRole = "" } = await req.json();

    const keywordList = customKeywords.join(", ");

    const yourPromptString = `
You are a resume reviewer bot. Analyze the following resume content and provide:

1. Key strengths  
2. Weak areas or missing skills  
3. Suggestions to improve  
4. Match for Frontend / Backend / Fullstack roles (based on resume content)  

Also, consider this when reviewing:
- Target Role: ${selectedRole}
- Required Skills: ${keywordList}

Resume Content: """  
${resumeText}  
"""

Return the response in this structured JSON format:  
{
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "bestFitRole": "Frontend" | "Backend" | "Fullstack" | "None"
}
    `;

    const cohereRes = await fetch("https://api.cohere.ai/v1/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
        "Content-Type": "application/json",
        "Cohere-Version": "2022-12-06"
      },
      body: JSON.stringify({
        model: "command-r-plus",
        prompt: yourPromptString,
        max_tokens: 400,
        temperature: 0.7
      })
    });

    const json = await cohereRes.json();

    if (!cohereRes.ok) {
      return NextResponse.json({
        error: "Cohere API error",
        details: json.message || "Unknown error from Cohere API"
      }, { status: cohereRes.status });
    }

    const rawOutput = json.generations?.[0]?.text || "";

    try {
      // Find JSON in the response
      const jsonStart = rawOutput.indexOf("{");
      const jsonEnd = rawOutput.lastIndexOf("}");

      if (jsonStart === -1 || jsonEnd === -1) {
        return NextResponse.json({
          error: "Invalid JSON format returned from Cohere",
          rawOutput
        }, { status: 500 });
      }

      const jsonString = rawOutput.slice(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(jsonString);

      // Ensure the response has the expected structure
      const result = {
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        bestFitRole: typeof parsed.bestFitRole === 'string' ? parsed.bestFitRole : 'None'
      };

      return NextResponse.json(result);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Raw output:", rawOutput);
      return NextResponse.json({
        error: "Failed to parse JSON from API response",
        message: parseError.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({
      error: "Unexpected error",
      message: error.message
    }, { status: 500 });
  }
}