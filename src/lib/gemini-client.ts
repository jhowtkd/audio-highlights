/**
 * Gemini client using Google's direct API
 * Uses Gemini 1.5 Flash for fast, cost-effective text generation
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.0-flash';

interface GeminiMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

interface GeminiGenerateRequest {
    contents: GeminiMessage[];
    generationConfig?: {
        temperature?: number;
        topK?: number;
        topP?: number;
        maxOutputTokens?: number;
        stopSequences?: string[];
    };
}

interface GeminiResponse {
    candidates: {
        content: {
            parts: { text: string }[];
            role: string;
        };
        finishReason: string;
        index: number;
    }[];
    usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
    };
}

export class GeminiClient {
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.GOOGLE_GEMINI_API_KEY || '';

        if (!this.apiKey) {
            throw new Error('GOOGLE_GEMINI_API_KEY must be set');
        }
    }

    async generateContent(
        prompt: string,
        systemInstruction?: string,
        options?: {
            temperature?: number;
            maxOutputTokens?: number;
        }
    ): Promise<string> {
        const messages: GeminiMessage[] = [];

        // Add system instruction as first user message if provided
        if (systemInstruction) {
            messages.push({
                role: 'user',
                parts: [{ text: systemInstruction }],
            });
            messages.push({
                role: 'model',
                parts: [{ text: 'Entendido. Vou seguir essas instruções.' }],
            });
        }

        // Add the actual prompt
        messages.push({
            role: 'user',
            parts: [{ text: prompt }],
        });

        const requestBody: GeminiGenerateRequest = {
            contents: messages,
            generationConfig: {
                temperature: options?.temperature ?? 0.7,
                maxOutputTokens: options?.maxOutputTokens ?? 8192, // Gemini 2.0 Flash max
                topK: 40,
                topP: 0.95,
            },
        };

        const url = `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`;

        // Retry with exponential backoff for temporary errors
        const maxRetries = 3;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(`[Gemini] Calling ${GEMINI_MODEL} (attempt ${attempt}/${maxRetries})...`);

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                    signal: AbortSignal.timeout(60000), // 60 seconds timeout
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('[Gemini] API Error:', response.status, errorText);

                    // Retry on 5xx errors or rate limits
                    if (response.status >= 500 || response.status === 429) {
                        lastError = new Error(`Gemini API error: ${response.status} - ${errorText}`);
                        if (attempt < maxRetries) {
                            const waitTime = 1000 * Math.pow(2, attempt - 1);
                            console.log(`[Gemini] Retrying in ${waitTime}ms...`);
                            await new Promise((resolve) => setTimeout(resolve, waitTime));
                            continue;
                        }
                        throw lastError;
                    }

                    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
                }

                const data: GeminiResponse = await response.json();

                if (!data.candidates || data.candidates.length === 0) {
                    throw new Error('No response from Gemini');
                }

                const text = data.candidates[0].content.parts.map((p) => p.text).join('');

                console.log(
                    `[Gemini] Response received (${data.usageMetadata?.totalTokenCount || 'unknown'} tokens)`
                );

                return text;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                // Only retry on network errors
                if (attempt < maxRetries && (error as Error).message?.includes('fetch')) {
                    const waitTime = 1000 * Math.pow(2, attempt - 1);
                    console.log(`[Gemini] Network error, retrying in ${waitTime}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, waitTime));
                    continue;
                }

                throw lastError;
            }
        }

        throw lastError || new Error('Failed after max retries');
    }
}

// Singleton instance
let geminiClient: GeminiClient | null = null;

export function getGeminiClient(): GeminiClient {
    if (!geminiClient) {
        geminiClient = new GeminiClient();
    }
    return geminiClient;
}
