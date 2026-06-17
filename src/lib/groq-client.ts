import OpenAI from 'openai';

let groqInstance: OpenAI | null = null;

export const getGroqClient = () => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not defined in environment variables');
    }

    if (!groqInstance) {
        groqInstance = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: 'https://api.groq.com/openai/v1',
            timeout: 30000, // SECURITY: Prevent resource exhaustion from hanging requests
        });
    }

    return groqInstance;
};

// Configure Whisper using Groq
// Note: Groq is compatible with OpenAI API format but uses different model names
export const GROQ_WHISPER_MODEL = 'whisper-large-v3';
