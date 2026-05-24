import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;

async function run() {
  console.log('Loading model...');
  const startLoad = performance.now();
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    quantized: true,
  });
  const endLoad = performance.now();
  console.log(`Model loaded in ${(endLoad - startLoad).toFixed(2)}ms`);

  const texts = [
    "The quick brown fox jumps over the lazy dog.",
    "Artificial intelligence is transforming the world.",
    "Podcasts are a great way to consume audio content.",
    "Machine learning models can generate text and audio.",
    "I love listening to music in my free time."
  ];

  console.log('Generating embeddings...');
  const startEmbed = performance.now();
  const embeddings = await Promise.all(texts.map(text => extractor(text, { pooling: 'mean', normalize: true })));
  const endEmbed = performance.now();
  console.log(`Generated ${texts.length} embeddings in ${(endEmbed - startEmbed).toFixed(2)}ms`);

  const query = "AI and machine learning";
  console.log(`\nQuery: "${query}"`);

  const queryEmbedding = await extractor(query, { pooling: 'mean', normalize: true });

  // Calculate cosine similarity
  const similarities = texts.map((text, i) => {
    const embed1 = queryEmbedding.data;
    const embed2 = embeddings[i].data;
    let dotProduct = 0;
    for (let j = 0; j < embed1.length; j++) {
      dotProduct += embed1[j] * embed2[j];
    }
    return { text, score: dotProduct };
  });

  similarities.sort((a, b) => b.score - a.score);

  console.log('\nResults:');
  similarities.forEach(result => {
    console.log(`[${result.score.toFixed(4)}] ${result.text}`);
  });
}

run();
