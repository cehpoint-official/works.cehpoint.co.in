import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;
let cachedModelName: string | null = null;

export const initGemini = (apiKey: string) => {
  genAI = new GoogleGenerativeAI(apiKey);
};

// Helper to try multiple model names if one fails (handles API versioning/region differences)
async function getRobustModel(genAI: any) {
  const modelsToTry = [
    'gemini-2.5-flash',
  ];

  if (cachedModelName) {
    return genAI.getGenerativeModel({ model: cachedModelName });
  }

  // Use model from ENV if specified to bypass probing
  if (process.env.GEMINI_MODEL_OVERRIDE) {
    cachedModelName = process.env.GEMINI_MODEL_OVERRIDE;
    return genAI.getGenerativeModel({ model: cachedModelName });
  }

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI] Probing model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });

      // Perform a real (but tiny) check to ensure the model exists and is accessible
      await model.generateContent({ contents: [{ role: 'user', parts: [{ text: 'ping' }] }] });

      console.log(`[AI] ✅ Model ${modelName} active.`);
      cachedModelName = modelName;
      return model;
    } catch (e: any) {
      const msg = e.message?.toLowerCase() || '';
      console.warn(`[AI] ❌ Model ${modelName} unavailable:`, msg);
      lastError = e;

      // If it's a 429, 404, 403 or model error, continue to the next candidate
      // This is crucial because some models might have a limit of 0 (429) but others might work.
      if (msg.includes('429') || msg.includes('quota') || msg.includes('404') || msg.includes('not found') || msg.includes('403') || msg.includes('model')) {
        continue;
      }

      // For truly unexpected errors, we stop.
      throw e;
    }
  }

  // If we reach here, no models worked.
  if (lastError?.message?.includes('429') || lastError?.message?.includes('quota')) {
    throw new Error('All Gemini models are currently reaching rate limits or have 0 quota for this key. Please check your Google AI Studio plan.');
  }

  throw new Error('No compatible Gemini models found. Check your API key and permissions.');
}

export const generateKnowledgeQuestions = async (skills: string[]): Promise<any[]> => {
  if (!genAI) throw new Error('Gemini AI not initialized');
  const model = await getRobustModel(genAI);
  const prompt = `Generate 5 multiple-choice questions to test knowledge in ${skills.join(', ')}. 
  Return a JSON array with this structure:
  [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0
    }
  ]
  Only return the JSON array, no other text.`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
};

export const evaluateDemoTask = async (taskDescription: string, submission: string): Promise<{ score: number; feedback: string }> => {
  if (!genAI) throw new Error('Gemini AI not initialized');
  const model = await getRobustModel(genAI);
  const prompt = `Evaluate this demo task submission:
  Task: ${taskDescription}
  Submission: ${submission}
  Provide a score from 0-100 and detailed feedback.
  Return a JSON object:
  {
    "score": 85,
    "feedback": "Detailed feedback here"
  }
  Only return the JSON object, no other text.`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
};

export const matchTaskToWorkers = async (task: any, workers: any[]): Promise<string[]> => {
  if (!genAI) throw new Error('Gemini AI not initialized');
  const model = await getRobustModel(genAI);
  const prompt = `Match this task to suitable workers:
  Task: ${JSON.stringify(task)}
  Workers: ${JSON.stringify(workers.map(w => ({ id: w.id, skills: w.skills, experience: w.experience })))}
  Return a JSON array of worker IDs that are good matches:
  ["worker-id-1", "worker-id-2"]
  Only return the JSON array, no other text.`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
};

export const generateTaskDescription = async (title: string, category: string, skills: string[]): Promise<string> => {
  if (!genAI) throw new Error('Gemini AI not initialized');
  const model = await getRobustModel(genAI);
  const prompt = `Write a professional, concise, and engaging project description for a task with the following details:
  Project Title: ${title}
  Category: ${category}
  Required Skills: ${skills.join(', ')}
  The description should:
  1. Clearly state the objective.
  2. Outline the core technical requirements.
  3. Mention the key deliverables.
  4. Use a professional, motivating tone for a specialist worker.
  5. Be around 3-5 sentences long.
  Only return the generated text, no other formatting or titles.`;
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};
