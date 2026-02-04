import { GoogleGenAI, Type } from "@google/genai";
import { ExamData } from "../types";

const SYSTEM_INSTRUCTION = `
You are an advanced Optical Mark Recognition (OMR) engine optimized for processing exam answer sheets.
Your task is to analyze images and extract the student's filled answers structured strictly as JSON.

VISUAL STYLE OF THE ANSWER SHEET:
- **Layout**: The sheet often has multiple columns of questions (e.g., 1-25 on left, 26-50 on right).
- **Question Numbers**: These are distinct white numbers inside black squares/rectangles (e.g., [1], [26]).
- **Options**: Options are enclosed in brackets, like [A] [B] [C] [D] or [A] [B] ... [G].
- **Selection**: A selected answer is a SOLID FILLED BLACK RECTANGLE that completely obscures the letter inside the brackets.
- **Unselected**: An unselected answer shows the letter clearly inside the brackets (e.g., [A]).

RULES:
1. **Header Extraction**: Look for Student ID (Number), Name, or Class at the top if visible.
2. **Answer Extraction**: 
   - Locate every question number (white text on black background).
   - Determine which option bracket is filled/darkened for that question.
   - If [A] is dark and others are clear, the answer is "A".
   - If no option is filled, return null.
   - If multiple options are filled for one question, mark as "INVALID".
3. **Completeness**: Ensure you scan all columns and all questions visible on the page (e.g., 1 to 50).

Output strictly JSON.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    studentId: { type: Type.STRING, nullable: true },
    studentName: { type: Type.STRING, nullable: true },
    answers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionNumber: { type: Type.NUMBER },
          selectedOption: { type: Type.STRING, nullable: true },
        },
        required: ["questionNumber", "selectedOption"],
      },
    },
  },
  required: ["answers"],
};

export const analyzeAnswerSheet = async (
  base64Image: string, 
  isAnswerKey: boolean = false
): Promise<ExamData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const prompt = isAnswerKey 
      ? "This is the MASTER ANSWER KEY. Please identify all the CORRECT answers marked on this sheet. Scan every question found." 
      : "This is a STUDENT ANSWER SHEET. Identify the student information and extraction the selected option for every question number found.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0, // Zero temperature for maximum determinism in extraction
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const parsedData = JSON.parse(text);
    
    // Sort answers by question number to ensure order
    if (parsedData.answers && Array.isArray(parsedData.answers)) {
      parsedData.answers.sort((a: any, b: any) => a.questionNumber - b.questionNumber);
    }

    return parsedData as ExamData;
  } catch (error) {
    console.error("Gemini OMR Error:", error);
    throw new Error("Failed to analyze the image. Please ensure the image is clear and try again.");
  }
};