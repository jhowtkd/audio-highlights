/**
 * Pricing constants for API usage estimation
 */

export const PRICING = {
    // Whisper (transcription) - per minute
    // Using Groq: ~$0.03/hour = $0.0005/minute
    WHISPER: {
        PER_MINUTE: 0.0005,
    },

    // GPT-5 Nano (text generation) - per 1M tokens
    // Estimated based on GPT-4o-mini pricing
    GPT_NANO: {
        INPUT_PER_1M: 0.15,
        OUTPUT_PER_1M: 0.60,
    }
} as const;

export function calculateWhisperCost(durationSeconds: number): number {
    const minutes = Math.ceil(durationSeconds / 60);
    return minutes * PRICING.WHISPER.PER_MINUTE;
}

export function calculateGPTCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1_000_000) * PRICING.GPT_NANO.INPUT_PER_1M;
    const outputCost = (outputTokens / 1_000_000) * PRICING.GPT_NANO.OUTPUT_PER_1M;
    return inputCost + outputCost;
}

export function estimateTotalCost(durationSeconds: number): {
    min: number;
    max: number;
    breakdown: { whisper: number; gptMin: number; gptMax: number };
} {
    const whisperCost = calculateWhisperCost(durationSeconds);

    // Estimate tokens (roughly 150 words/min -> ~200 tokens/min)
    const durationMinutes = durationSeconds / 60;
    const estimatedInputTokens = durationMinutes * 200;

    // Output tokens estimate (depends on highlights count/length)
    // Min: ~1000 tokens (few highlights)
    // Max: ~4000 tokens (many highlights + analysis)
    const minOutputTokens = 1000;
    const maxOutputTokens = 4000;

    const gptMin = calculateGPTCost(estimatedInputTokens, minOutputTokens);
    const gptMax = calculateGPTCost(estimatedInputTokens, maxOutputTokens);

    return {
        min: whisperCost + gptMin,
        max: whisperCost + gptMax,
        breakdown: {
            whisper: whisperCost,
            gptMin,
            gptMax
        }
    };
}
