const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("./generated/client");

const app = express();
const PORT = 3020;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const AUTH_SERVICE_URL = "http://localhost:3010";

// --- 1. LOCAL DATA & FALLBACK HELPERS ---

// Question Bank
const QUESTION_BANK = {
  "Frontend Engineer": {
    "Junior": [
      {
        questionText: "What is the difference between let, const, and var in JavaScript?",
        idealAnswer: "var is function-scoped, can be redeclared, and is hoisted with undefined. let and const are block-scoped, cannot be redeclared in the same scope, and are not initialized during hoisting (Temporal Dead Zone). const variables must be initialized and cannot be reassigned."
      },
      {
        questionText: "Explain the difference between state and props in React.",
        idealAnswer: "Props are read-only configuration parameters passed down from a parent component. State is a private, mutable data structure managed internally within a component that triggers a re-render when updated."
      },
      {
        questionText: "What is the Virtual DOM and how does React use it to render pages?",
        idealAnswer: "The Virtual DOM is a lightweight JavaScript representation of the real DOM. React updates this virtual tree, compares it with the previous snapshot (diffing), and makes minimal modifications to the real DOM."
      }
    ],
    "Mid": [
      {
        questionText: "What is a closure in JavaScript and can you give a common use case?",
        idealAnswer: "A closure is the combination of a function bundled together with references to its surrounding state (lexical environment), allowing access to variables from an outer function scope even after it returned."
      },
      {
        questionText: "How does React's useEffect hook work, and how do you clean up side effects?",
        idealAnswer: "useEffect runs side effects after renders. Returning a function from the effect serving as the cleanup callback, running before unmount or subsequent runs."
      }
    ],
    "Senior": [
      {
        questionText: "How would you optimize a slow React application that suffers from excessive re-renders?",
        idealAnswer: "Profile using React DevTools. Memoize with React.memo, useMemo, and useCallback. Implement virtualized lists. Colocate states, debounce inputs, and lazy load dynamic imports."
      }
    ]
  },
  "Backend Engineer": {
    "Junior": [
      {
        questionText: "What is the difference between GET and POST HTTP requests?",
        idealAnswer: "GET retrieves data, appends parameters in URL query, is idempotent. POST sends data in body to create resources, is not idempotent."
      }
    ]
  }
};

function getRandomQuestions(role, level, count = 3) {
  const roleBank = QUESTION_BANK[role] || QUESTION_BANK["Frontend Engineer"];
  const levelBank = roleBank[level] || roleBank["Mid"] || roleBank["Junior"];
  const shuffled = [...levelBank].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Local Keyword Grader
const KEYWORD_MAP = {
  "let, const, and var": ["scope", "block", "hoist", "reassign", "redeclare", "temporal dead zone", "tdz"],
  "state and props": ["read-only", "prop", "state", "mutable", "parent", "internal", "render"],
  "virtual dom": ["lightweight", "diff", "reconciliation", "real dom", "update", "render"],
  "closure": ["closure", "lexical", "scope", "inner", "outer", "privacy", "encapsulate"],
  "useeffect": ["effect", "side effect", "dependency", "mount", "unmount", "cleanup"]
};

function gradeAnswerOffline(userAnswer, idealAnswer, questionText) {
  const answer = userAnswer.trim();
  if (!answer || answer === "No response provided.") {
    return { score: 0, critique: "No response was recorded. Please speak clearly into the microphone." };
  }

  const words = answer.split(/\s+/);
  const wordCount = words.length;

  const fillers = ["uh", "um", "like", "you know", "ah"];
  let fillersCount = 0;
  words.forEach(word => {
    if (fillers.includes(word.toLowerCase().replace(/[^a-z]/g, ""))) fillersCount++;
  });

  const lowercaseAnswer = answer.toLowerCase();
  const lowercaseQuestion = questionText.toLowerCase();
  
  let matchingKeywords = [];
  for (const [topic, keywords] of Object.entries(KEYWORD_MAP)) {
    if (lowercaseQuestion.includes(topic.toLowerCase())) {
      matchingKeywords = keywords;
      break;
    }
  }

  if (matchingKeywords.length === 0) {
    matchingKeywords = Array.from(new Set(idealAnswer.toLowerCase().split(/\s+/)))
      .map(w => w.replace(/[^a-z]/g, ""))
      .filter(w => w.length > 5).slice(0, 5);
  }

  let matched = 0;
  matchingKeywords.forEach(k => {
    if (lowercaseAnswer.includes(k)) matched++;
  });

  const keywordScore = matchingKeywords.length > 0 ? (matched / matchingKeywords.length) * 100 : 50;
  let lengthMultiplier = wordCount < 15 ? 0.3 : wordCount < 30 ? 0.7 : 1.0;
  const fillerRate = fillersCount / wordCount;
  const penalty = fillerRate > 0.1 ? 10 : fillerRate > 0.05 ? 5 : 0;

  let score = Math.round(keywordScore * lengthMultiplier - penalty);
  score = Math.max(0, Math.min(100, score));

  let critique = `Graded response: ${score}/100. `;
  if (score >= 80) {
    critique += `Excellent job! You covered key concepts clearly with minimal filler words (${fillersCount}).`;
  } else if (score >= 60) {
    critique += `Decent answer. To improve, cover the concepts more thoroughly and try to reduce filler words.`;
  } else {
    critique += `Too short or missing key conceptual keywords. Study the ideal answer reference and try again.`;
  }

  return { score, critique, wordCount, fillersCount };
}

// Language mapper
const LANGUAGES = {
  "en-US": "English",
  "uk-UA": "Ukrainian",
  "es-ES": "Spanish",
  "de-DE": "German",
  "fr-FR": "French",
  "it-IT": "Italian",
  "pt-PT": "Portuguese",
  "pl-PL": "Polish",
  "tr-TR": "Turkish",
  "ja-JP": "Japanese",
  "zh-CN": "Chinese Mandarin",
  "ko-KR": "Korean",
  "nl-NL": "Dutch",
  "sv-SE": "Swedish",
  "ar-SA": "Arabic"
};

// --- 2. GEMINI AI CLIENT ---

async function callGemini(prompt) {
  if (!GEMINI_API_KEY) return null;
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    return null;
  }
}

async function generateDynamicQuestions(role, level, languageName) {
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

  const text = await callGemini(prompt);
  if (!text) return null;
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    return null;
  }
}

async function gradeAnswerWithAI(questionText, idealAnswer, userAnswer, languageName) {
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
  "score": <number from 0 to 100>,
  "critique": "feedback paragraph in ${languageName} highlighting what they did well, what keywords they missed, and advice to restructure"
}`;

  const text = await callGemini(prompt);
  if (!text) return null;
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    return null;
  }
}

// --- 3. EXPRESS ROUTES ---

// Start Interview Session
app.post("/api/interview/start", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { role, level, language = "en-US" } = req.body;
    if (!role || !level) {
      return res.status(400).json({ error: "Role and level are required" });
    }

    // Call Auth Microservice to verify and deduct credits
    const authVerifyRes = await fetch(`${AUTH_SERVICE_URL}/api/internal/users/${userId}`);
    if (!authVerifyRes.ok) {
      return res.status(404).json({ error: "User profile verify failed downstream" });
    }
    const userProfile = await authVerifyRes.json();

    if (!userProfile.isPro && userProfile.credits <= 0) {
      return res.status(402).json({ error: "Insufficient credits" });
    }

    // Generate questions
    const langName = LANGUAGES[language] || "English";
    let questionsList = await generateDynamicQuestions(role, level, langName);
    if (!questionsList) {
      console.log("Fallback questions used.");
      questionsList = getRandomQuestions(role, level, 3);
    }

    // Deduct credit internally if not Pro
    if (!userProfile.isPro) {
      const deductRes = await fetch(`${AUTH_SERVICE_URL}/api/internal/users/${userId}/deduct-credit`, {
        method: "POST"
      });
      if (!deductRes.ok) {
        return res.status(500).json({ error: "Failed to deduct credit downstream" });
      }
    }

    // Create interview in local database
    const newInterview = await prisma.interview.create({
      data: {
        userId,
        role,
        level,
        language,
        status: "IN_PROGRESS",
        questions: {
          create: questionsList.map(q => ({
            questionText: q.questionText,
            idealAnswer: q.idealAnswer,
            answerText: ""
          }))
        }
      },
      include: { questions: true }
    });

    res.json({
      success: true,
      interviewId: newInterview.id,
      role: newInterview.role,
      level: newInterview.level,
      questions: newInterview.questions.map(q => ({ id: q.id, questionText: q.questionText }))
    });
  } catch (error) {
    console.error("AI service start error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Submit Answer
app.post("/api/interview/:id/answer", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { questionId, answerText } = req.body;
    const interviewId = req.params.id;

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { questions: true }
    });

    if (!interview) return res.status(404).json({ error: "Interview session not found" });
    if (interview.userId !== userId) return res.status(403).json({ error: "Forbidden" });

    const question = interview.questions.find(q => q.id === questionId);
    if (!question) return res.status(404).json({ error: "Question not found" });

    // Grade answer
    const offlineGrading = gradeAnswerOffline(answerText, question.idealAnswer, question.questionText);
    const langName = LANGUAGES[interview.language] || "English";
    
    let score = offlineGrading.score;
    let critique = offlineGrading.critique;

    const aiEvaluation = await gradeAnswerWithAI(question.questionText, question.idealAnswer, answerText, langName);
    if (aiEvaluation) {
      score = aiEvaluation.score;
      critique = aiEvaluation.critique;
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: { answerText, score, critique }
    });

    res.json({
      success: true,
      questionId: updated.id,
      score,
      critique,
      wordCount: offlineGrading.wordCount,
      fillersCount: offlineGrading.fillersCount
    });
  } catch (error) {
    console.error("AI service answer error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Finish Interview
app.post("/api/interview/:id/finish", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const interviewId = req.params.id;

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { questions: true }
    });

    if (!interview) return res.status(404).json({ error: "Interview not found" });
    if (interview.userId !== userId) return res.status(403).json({ error: "Forbidden" });

    let total = 0;
    let count = 0;
    interview.questions.forEach(q => {
      if (q.score !== null) {
        total += q.score;
        count++;
      }
    });

    const overallScore = count > 0 ? Math.round(total / count) : 0;
    const isUkrainian = interview.language === "uk-UA";
    
    let feedback = "";
    if (overallScore >= 85) {
      feedback = isUkrainian
        ? "Чудовий результат! Ви впевнено володієте технічною термінологією, детально пояснюєте процеси та структуруєте думки."
        : "Excellent performance! You demonstrate a strong grasp of technical concepts and articulate them clearly.";
    } else if (overallScore >= 70) {
      feedback = isUkrainian
        ? "Хороший результат. Ви знаєте базу, але деякі відповіді можна зробити більш структурованими та навести приклади."
        : "Solid technical foundation. You clearly understand core systems, though explanations could be more precise.";
    } else {
      feedback = isUkrainian
        ? "Рекомендуємо більше практики. Прогляньте еталонні відповіді та спробуйте давати ширші пояснення."
        : "Further practice recommended. Focus on active recall and expanding your answers to cover critical concepts.";
    }

    const updated = await prisma.interview.update({
      where: { id: interviewId },
      data: { status: "COMPLETED", overallScore, feedback },
      include: { questions: true }
    });

    res.json({ success: true, interview: updated });
  } catch (error) {
    console.error("AI service finish error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch Single Interview Details
app.get("/api/interview/:id", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const interview = await prisma.interview.findUnique({
      where: { id: req.params.id },
      include: { questions: true }
    });
    if (!interview) return res.status(404).json({ error: "Interview not found" });
    if (interview.userId !== userId) return res.status(403).json({ error: "Forbidden" });

    res.json({ success: true, interview });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch Interviews History (All completed and in progress for user)
app.get("/api/interview/history", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const interviews = await prisma.interview.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { questions: true }
    });

    res.json({ success: true, interviews });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Developer Seeding API
app.post("/api/internal/dev/seed", async (req, res) => {
  try {
    const { userId } = req.body;
    await prisma.interview.deleteMany({ where: { userId } });

    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    // Seed Interview 1 (Frontend - Score 78)
    const int1 = await prisma.interview.create({
      data: {
        userId,
        role: "Frontend Engineer",
        level: "Mid",
        status: "COMPLETED",
        overallScore: 78,
        feedback: "Solid React developer skillset. Strong conceptual awareness of React DOM rendering and block bindings.",
        createdAt: twoDaysAgo
      }
    });

    await prisma.question.createMany({
      data: [
        {
          interviewId: int1.id,
          questionText: "What is the Virtual DOM and how does React use it to render pages?",
          answerText: "Virtual DOM is a copy of real DOM in memory. When state changes, react compares the virtual tree with old one, this is called diffing, and then updates only changed nodes in real dom.",
          score: 82,
          critique: "Excellent response! You explained the concept clearly, covering the diffing phase and reconciliation.",
          idealAnswer: "The Virtual DOM is a lightweight JavaScript representation of the real DOM. When state changes, React updates this virtual tree, compares it with the previous snapshot (diffing algorithm), and bats updates to make minimal modifications to the real DOM (reconciliation).",
        },
        {
          interviewId: int1.id,
          questionText: "Explain the difference between state and props in React.",
          answerText: "Props are parameters passed to component. State is internal data that component can change. Props are read only, state is mutable.",
          score: 74,
          critique: "Good solid answer. You hit the main points but could be slightly more structured. To improve, you could explicitly mention that state updates trigger component re-renders.",
          idealAnswer: "Props are read-only configuration parameters passed down from a parent component, making components reusable. State is a private, mutable data structure managed internally within a component that triggers a re-render when updated via state setters.",
        }
      ]
    });

    // Seed Interview 2 (Backend - Score 88)
    const int2 = await prisma.interview.create({
      data: {
        userId,
        role: "Backend Engineer",
        level: "Senior",
        status: "COMPLETED",
        overallScore: 88,
        feedback: "Excellent performance! Demonstrates clear senior-level understanding of database indices, write trade-offs, and security mitigation for JSON Web Tokens.",
        createdAt: oneDayAgo
      }
    });

    await prisma.question.createMany({
      data: [
        {
          interviewId: int2.id,
          questionText: "Explain the concept of database indexing and its trade-offs.",
          answerText: "Index makes reads faster. It uses B-Tree data structures. The trade-off is writes get slower because index has to be updated on inserts, and it uses more disk space.",
          score: 92,
          critique: "Excellent response! You explained the concepts clearly, covering key technical requirements (B-Tree, read acceleration vs write cost).",
          idealAnswer: "An index is a data structure (like a B-Tree) that improves data retrieval speed on specific columns in a database table. The trade-off is that indexes consume additional storage space and slow down write operations (INSERT, UPDATE, DELETE) because the index must be updated.",
        }
      ]
    });

    res.json({ success: true });
  } catch (error) {
    console.error("AI service seed error:", error);
    res.status(500).json({ error: "Internal db error" });
  }
});

app.listen(PORT, () => {
  console.log(`AI Service listening on port ${PORT}`);
});
