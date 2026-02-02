import type { NextApiRequest, NextApiResponse } from 'next';
import { initGemini, generateTaskDescription } from '../../../utils/gemini';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { title, category, skills } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Project title is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('[AI] GEMINI_API_KEY is missing in environment variables');
        return res.status(500).json({ error: 'AI service is not configured. Please add GEMINI_API_KEY to your environment.' });
    }

    try {
        initGemini(apiKey);
        const description = await generateTaskDescription(title, category || 'General', skills || []);
        res.status(200).json({ description });
    } catch (error: any) {
        console.error('[AI] Generation error:', error);
        const message = error.message || 'Unknown generation error';

        if (message.includes('rate limit') || message.includes('429')) {
            return res.status(429).json({ error: 'AI rate limit exceeded. Please wait a moment before trying again.' });
        }

        res.status(500).json({ error: `AI Error: ${message}` });
    }
}
