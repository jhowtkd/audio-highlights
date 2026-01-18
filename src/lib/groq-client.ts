import OpenAI from 'openai';

if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not defined in environment variables');
}

export const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

// Configure Whisper using Groq
// Note: Groq is compatible with OpenAI API format but uses different model names
export const GROQ_WHISPER_MODEL = 'whisper-large-v3';
