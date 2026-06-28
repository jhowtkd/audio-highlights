import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;

class PipelineSingleton {
  static task = 'feature-extraction';
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance: any = null;

  static async getInstance(progress_callback: any) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

let indexedSegments: { id: string; text: string; embedding: number[] }[] = [];

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  if (type === 'INDEX') {
    const segments = data;
    try {
      const extractor = await PipelineSingleton.getInstance((x: any) => {
        self.postMessage({ status: 'progress', progress: x });
      });

      self.postMessage({ status: 'indexing' });

      for (const segment of segments) {
        const output = await extractor(segment.text, { pooling: 'mean', normalize: true });
        indexedSegments.push({
          id: segment.id,
          text: segment.text,
          embedding: Array.from(output.data)
        });
      }

      self.postMessage({ status: 'ready', count: indexedSegments.length });
    } catch (e: any) {
      self.postMessage({ status: 'error', error: e.message });
    }
  }

  if (type === 'SEARCH') {
    const query = data.query;
    const maxResults = data.maxResults || 5;

    try {
      const extractor = await PipelineSingleton.getInstance(null);
      const queryOutput = await extractor(query, { pooling: 'mean', normalize: true });
      const queryEmbedding = Array.from(queryOutput.data);

      const results = indexedSegments.map(segment => {
        const score = cosineSimilarity(queryEmbedding, segment.embedding);
        return {
          segmentId: segment.id,
          score: score
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

      self.postMessage({ status: 'search_result', query, results });
    } catch (e: any) {
      self.postMessage({ status: 'error', error: e.message });
    }
  }
});
