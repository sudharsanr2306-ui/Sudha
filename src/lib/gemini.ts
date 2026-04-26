import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateTaskDescription(topic: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a marketing manager for a campus ambassador program. 
      Generate a professional, engaging, and clear task description for Ambassadors based on this topic: "${topic}".
      Include:
      1. Objective
      2. Step-by-step instructions
      3. Deliverables
      Format as Markdown.`,
    });
    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "Failed to generate description. Please try manually.";
  }
}

export async function brainstormIdeas(programGoal: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Brainstorm 5 creative task ideas for a Campus Ambassador program with this goal: "${programGoal}".
      For each idea, provide a short title and a one-sentence summary.
      Format as Markdown list.`,
    });
    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "Failed to brainstorm ideas.";
  }
}
