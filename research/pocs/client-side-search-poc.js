import { pipeline, env } from '@xenova/transformers';

// Disable local models since we want to test fetching from HF hub,
// matching the intended browser behavior.
env.allowLocalModels = false;
env.useBrowserCache = false; // We are in node

async function run() {
  console.log('Loading model...');
  const startLoad = performance.now();
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    quantized: true,
  });
  const endLoad = performance.now();
  console.log(`Model loaded in ${(endLoad - startLoad).toFixed(2)}ms`);

  const segments = [
    "A inteligência artificial está mudando o mundo.",
    "O mercado financeiro reagiu bem hoje.",
    "Os processadores de última geração são muito rápidos.",
    "Receita para um bolo de chocolate fácil.",
    "A economia global enfrenta desafios de inflação."
  ];

  console.log('\nGenerating embeddings for segments...');
  const segmentEmbeddings = [];

  for (const text of segments) {
    const startEmb = performance.now();
    const output = await extractor(text, {
      pooling: 'mean',
      normalize: true,
    });
    const endEmb = performance.now();
    segmentEmbeddings.push({
      text,
      embedding: Array.from(output.data),
      timeMs: endEmb - startEmb
    });
    console.log(`- Embedded: "${text}" (${(endEmb - startEmb).toFixed(2)}ms)`);
  }

  const query = "assuntos financeiros e economia";
  console.log(`\nQuery: "${query}"`);

  const startQuery = performance.now();
  const queryOutput = await extractor(query, {
    pooling: 'mean',
    normalize: true,
  });
  const queryEmbedding = Array.from(queryOutput.data);
  const endQuery = performance.now();
  console.log(`Query embedded in ${(endQuery - startQuery).toFixed(2)}ms`);

  // Compute similarity
  const startSearch = performance.now();
  const results = segmentEmbeddings.map(seg => {
    let dotProduct = 0;
    for (let i = 0; i < queryEmbedding.length; i++) {
      dotProduct += queryEmbedding[i] * seg.embedding[i];
    }
    return {
      text: seg.text,
      score: dotProduct
    };
  });

  results.sort((a, b) => b.score - a.score);
  const endSearch = performance.now();

  console.log(`\nSearch completed in ${(endSearch - startSearch).toFixed(2)}ms`);
  console.log('\nResults:');
  results.forEach(r => {
    console.log(`[${r.score.toFixed(4)}] ${r.text}`);
  });
}

run().catch(console.error);
