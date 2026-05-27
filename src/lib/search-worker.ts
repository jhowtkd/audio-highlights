import { pipeline, env } from '@xenova/transformers';

// Skip local model check since we are running in browser and using HF Hub
env.allowLocalModels = false;

// We need to keep a reference to the pipeline
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractor: any = null;

// Store embeddings in memory
let segmentEmbeddings: { id: string, start: number, end: number, text: string, embedding: number[] }[] = [];

// Helper function to calculate cosine similarity
// The embeddings are already L2-normalized via normalize: true,
// so the dot product is exactly the cosine similarity.
function cosineSimilarity(a: number[], b: number[]) {
    let dotProduct = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
    }
    return dotProduct;
}

let currentJobId = 0;

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
    const { action, payload } = event.data;

    try {
        if (action === 'load') {
            // Send a progress message that we are starting
            self.postMessage({ status: 'progress', type: 'load', progress: 0 });

            // Load the model
            extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
                quantized: true,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                progress_callback: (info: any) => {
                    // info usually has { status, name, file, progress }
                    self.postMessage({ status: 'progress', type: 'load', info });
                }
            });

            self.postMessage({ status: 'ready' });
        }

        else if (action === 'index') {
            const { segments } = payload;

            currentJobId++;
            const jobId = currentJobId;

            if (!extractor) {
                throw new Error('Model not loaded yet');
            }

            self.postMessage({ status: 'progress', type: 'index', progress: 0 });

            const newEmbeddings = [];

            // Process segments
            const total = segments.length;
            for (let i = 0; i < total; i++) {
                if (jobId !== currentJobId) {
                    // Abort if a new job has started
                    return;
                }

                const segment = segments[i];

                // Extract embedding
                const output = await extractor(segment.text, { pooling: 'mean', normalize: true });
                const embedding = Array.from(output.data);

                newEmbeddings.push({
                    id: segment.id,
                    start: segment.start,
                    end: segment.end,
                    text: segment.text,
                    embedding: embedding as number[]
                });

                // Report progress every 10 segments or at the end
                if (i % 10 === 0 || i === total - 1) {
                    self.postMessage({ status: 'progress', type: 'index', progress: Math.round(((i + 1) / total) * 100) });
                }
            }

            if (jobId === currentJobId) {
                segmentEmbeddings = newEmbeddings;
                self.postMessage({ status: 'indexed', count: segmentEmbeddings.length });
            }
        }

        else if (action === 'search') {
            const { query, maxResults = 10 } = payload;

            if (!extractor) {
                throw new Error('Model not loaded yet');
            }
            if (segmentEmbeddings.length === 0) {
                throw new Error('No segments indexed');
            }

            // Extract query embedding
            const output = await extractor(query, { pooling: 'mean', normalize: true });
            const queryEmbedding = Array.from(output.data);

            // Compute similarity for all segments
            const results = segmentEmbeddings.map(segment => {
                const score = cosineSimilarity(queryEmbedding as number[], segment.embedding);
                return {
                    segmentId: segment.id,
                    text: segment.text,
                    startTime: segment.start,
                    endTime: segment.end,
                    relevanceScore: Math.round(score * 100),
                    // Adding a generic reason since we don't have GPT explaining it anymore
                    matchReason: 'Correspondência semântica encontrada localmente'
                };
            });

            // Sort and take top N
            // Filter out low relevance scores (e.g., < 20) to reduce noise
            const topResults = results
                .filter(r => r.relevanceScore >= 20)
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, maxResults);

            self.postMessage({ status: 'results', results: topResults, query });
        }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        self.postMessage({ status: 'error', error: error.message });
    }
});
