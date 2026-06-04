import { pipeline, env } from '@xenova/transformers';

// Skip local model check since we are running in browser and want to fetch from HF Hub
env.allowLocalModels = false;

// We use the Singleton pattern for the feature extraction pipeline
class PipelineSingleton {
  static task = 'feature-extraction' as const;
  static model = 'Xenova/all-MiniLM-L6-v2';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static instance: any = null;

  static async getInstance(progress_callback?: (progress: unknown) => void) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

// Interfaces
interface SegmentData {
  id: string;
  text: string;
  start: number;
  end: number;
}

interface IndexSegment extends SegmentData {
  embedding: number[];
}

let indexedSegments: IndexSegment[] = [];

// Helper function to calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  const { type, payload, id } = event.data;

  try {
    if (type === 'init') {
      // Pre-load the model
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const extractor = await PipelineSingleton.getInstance((x: unknown) => {
        // Send progress updates back to the main thread
        self.postMessage({ type: 'progress', payload: x });
      });
      self.postMessage({ type: 'init_complete' });
    }

    else if (type === 'index') {
      const segments: SegmentData[] = payload;

      const extractor = await PipelineSingleton.getInstance();

      const newIndexedSegments: IndexSegment[] = [];

      for (const segment of segments) {
        // Compute embedding for each segment
        const output = await extractor(segment.text, { pooling: 'mean', normalize: true });

        newIndexedSegments.push({
          ...segment,
          embedding: Array.from(output.data)
        });
      }

      indexedSegments = newIndexedSegments;
      self.postMessage({ type: 'index_complete', payload: { count: indexedSegments.length }, id });
    }

    else if (type === 'search') {
      const { query, maxResults = 10, threshold = 0.4 } = payload;

      if (!query || indexedSegments.length === 0) {
        self.postMessage({ type: 'search_complete', payload: [], id });
        return;
      }

      const extractor = await PipelineSingleton.getInstance();

      // Generate embedding for the query
      const queryOutput = await extractor(query, { pooling: 'mean', normalize: true });
      const queryEmbedding = Array.from(queryOutput.data);

      // Compare query embedding against all segment embeddings
      const results = indexedSegments.map(segment => {
        const score = cosineSimilarity(queryEmbedding as number[], segment.embedding);
        return {
          segmentId: segment.id,
          text: segment.text,
          startTime: segment.start,
          endTime: segment.end,
          relevanceScore: Math.round(score * 100), // convert to 0-100 scale for compatibility
          matchReason: 'Semantic match via client-side search' // placeholder
        };
      })
      .filter(r => r.relevanceScore >= threshold * 100) // Apply threshold
      .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort descending
      .slice(0, maxResults); // Take top N

      self.postMessage({ type: 'search_complete', payload: results, id });
    }
  } catch (error) {
    console.error('Search Worker Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    self.postMessage({ type: 'error', payload: errorMessage, id });
  }
});
