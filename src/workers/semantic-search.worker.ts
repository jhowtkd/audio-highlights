import { env, pipeline, type PipelineType } from '@xenova/transformers';

// Configure transformers.js to avoid loading local models (must use CDN or remote)
env.allowLocalModels = false;
// Optionally set cache dir if running in a supported environment,
// but for browser it uses Cache API automatically.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractor: any = null;
let segmentEmbeddings: { id: string; embedding: number[]; text: string; start: number; end: number }[] = [];
let isReady = false;

// Helper to calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

self.addEventListener('message', async (event) => {
    const { type, data } = event.data;

    if (type === 'INIT') {
        try {
            if (!extractor) {
                self.postMessage({ type: 'STATUS', status: 'Carregando modelo de IA...' });
                extractor = await pipeline('feature-extraction' as PipelineType, 'Xenova/all-MiniLM-L6-v2', {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    progress_callback: (progress: any) => {
                        self.postMessage({ type: 'PROGRESS', progress });
                    }
                });
            }
            isReady = true;
            self.postMessage({ type: 'READY' });
        } catch (error) {
            self.postMessage({ type: 'ERROR', error: error instanceof Error ? error.message : 'Unknown error' });
        }
    } else if (type === 'INDEX') {
        if (!isReady) return;

        self.postMessage({ type: 'INDEX_START' });

        const segments = data;
        segmentEmbeddings = [];
        const total = segments.length;

        self.postMessage({ type: 'STATUS', status: 'Indexando transcrição...' });

        for (let i = 0; i < total; i++) {
            const segment = segments[i];
            try {
                const output = await extractor(segment.text, { pooling: 'mean', normalize: true });
                segmentEmbeddings.push({
                    id: segment.id,
                    text: segment.text,
                    start: segment.start,
                    end: segment.end,
                    embedding: Array.from(output.data)
                });

                if (i % 10 === 0 || i === total - 1) {
                    self.postMessage({ type: 'INDEX_PROGRESS', progress: Math.round(((i + 1) / total) * 100) });
                }
            } catch (error) {
                 console.error('Error embedding segment', segment.id, error);
            }
        }

        self.postMessage({ type: 'INDEX_COMPLETE' });
    } else if (type === 'SEARCH') {
        if (!isReady || segmentEmbeddings.length === 0) {
            self.postMessage({ type: 'SEARCH_RESULTS', results: [] });
            return;
        }

        const query = data.query;
        const maxResults = data.maxResults || 10;

        try {
            const output = await extractor(query, { pooling: 'mean', normalize: true });
            const queryEmbedding = Array.from(output.data);

            const results = segmentEmbeddings.map(segment => {
                const score = cosineSimilarity(queryEmbedding as number[], segment.embedding);
                return {
                    segmentId: segment.id,
                    text: segment.text,
                    startTime: segment.start,
                    endTime: segment.end,
                    relevanceScore: Math.round(score * 100),
                    // Adding a generic match reason since it's hard to derive exact words with embeddings
                    matchReason: score > 0.5 ? 'Correspondência forte' : 'Correspondência parcial',
                };
            }).filter(r => r.relevanceScore >= 30) // Filter low relevance
              .sort((a, b) => b.relevanceScore - a.relevanceScore)
              .slice(0, maxResults);

            self.postMessage({ type: 'SEARCH_RESULTS', results });
        } catch (error) {
            self.postMessage({ type: 'ERROR', error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
});
