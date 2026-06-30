export interface AISecuredQuestion {
  questionText: string;
  idealAnswer: string;
}

export interface AIEvaluationResult {
  score: number;
  critique: string;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Helper to make API request
async function callGemini(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Gemini API error: ${response.status} ${response.statusText}`, errText);
      return null;
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return textOutput || null;
  } catch (error) {
    console.error("Failed to connect to Gemini API:", error);
    return null;
  }
}

// 1. Dynamic questions generator
export async function generateDynamicQuestions(
  role: string,
  level: string,
  languageName: string
): Promise<AISecuredQuestion[] | null> {
  const prompt = `You are a professional technical recruiter.
Generate exactly 3 challenging technical interview questions for a candidate interviewing for the role of '${role}' at experience level '${level}'.
The questions should test core concepts, systems design, and hands-on practices.

CRITICAL: You MUST write the "questionText" and "idealAnswer" values entirely in the language '${languageName}'.

Return a JSON array containing objects with exactly these keys:
[
  {
    "questionText": "the interview question string in ${languageName}",
    "idealAnswer": "a detailed reference response explaining all critical technical concepts in ${languageName}"
  }
]`;

  const responseText = await callGemini(prompt);
  if (!responseText) return null;

  try {
    const parsed = JSON.parse(responseText.trim());
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].questionText && parsed[0].idealAnswer) {
      return parsed as AISecuredQuestion[];
    }
    return null;
  } catch (e) {
    console.error("Failed to parse dynamic questions JSON:", e);
    return null;
  }
}

// 2. Dynamic response grader
export async function gradeAnswerWithAI(
  questionText: string,
  idealAnswer: string,
  userAnswer: string,
  languageName: string
): Promise<AIEvaluationResult | null> {
  const prompt = `You are a senior engineering manager conducting a technical interview.
Grade the candidate's spoken response to the technical question.
Compare their answer to the ideal answer, taking into account keyword coverage, conceptual correctness, and structural clarity.

Context:
- Question Asked: "${questionText}"
- Ideal Answer Key: "${idealAnswer}"
- Candidate Spoken Response: "${userAnswer}"

CRITICAL: You MUST write the qualitative feedback "critique" entirely in the language '${languageName}'.

Return a JSON object containing exactly these keys:
{
  "score": <number from 0 to 100 based on technical accuracy, coverage of core concepts, and completeness>,
  "critique": "a detailed, constructive feedback paragraph written in ${languageName}. Highlight what concepts they explained well. Explicitly mention what critical keywords or concepts from the ideal answer they missed. Give 1-2 sentences of advice on how to restructure their response in ${languageName} in a real interview"
}`;

  const responseText = await callGemini(prompt);
  if (!responseText) return null;

  try {
    const parsed = JSON.parse(responseText.trim());
    if (typeof parsed.score === "number" && typeof parsed.critique === "string") {
      return parsed as AIEvaluationResult;
    }
    return null;
  } catch (e) {
    console.error("Failed to parse evaluation result JSON:", e);
    return null;
  }
}
