import { pipeline } from '@xenova/transformers';

async function main() {
  console.log('Loading model...');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  console.log('Generating embeddings...');
  const segments = [
    "O dinheiro não traz felicidade, mas ajuda.",
    "A inteligência artificial está revolucionando a tecnologia.",
    "Investimentos em renda fixa são mais seguros.",
    "Os cachorros são os melhores amigos do homem."
  ];

  const query = "fale sobre finanças e economia";

  const queryEmbedding = await extractor(query, { pooling: 'mean', normalize: true });

  console.log('Query embedding generated. Shape:', queryEmbedding.dims);

  const results = [];

  for (let i = 0; i < segments.length; i++) {
    const docEmbedding = await extractor(segments[i], { pooling: 'mean', normalize: true });

    // Calculate cosine similarity (dot product of normalized vectors)
    let similarity = 0;
    for (let j = 0; j < queryEmbedding.data.length; j++) {
      similarity += queryEmbedding.data[j] * docEmbedding.data[j];
    }

    results.push({
      text: segments[i],
      score: similarity
    });
  }

  results.sort((a, b) => b.score - a.score);

  console.log('\nResults for query:', query);
  results.forEach(r => console.log(`[Score: ${r.score.toFixed(4)}] ${r.text}`));
}

main().catch(console.error);
