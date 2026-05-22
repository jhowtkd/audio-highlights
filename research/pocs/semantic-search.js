import { pipeline } from '@xenova/transformers';

async function testSemanticSearch() {
  console.log("Loading model...");
  // Use a small, fast model for embeddings
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  const segments = [
    { id: '1', text: "O aprendizado de máquina é uma área da inteligência artificial." },
    { id: '2', text: "Gatos são animais de estimação muito populares." },
    { id: '3', text: "Para fazer um bolo, você precisa de farinha e ovos." },
    { id: '4', text: "As redes neurais artificiais são inspiradas no cérebro humano." },
    { id: '5', text: "Deep learning tem revolucionado a visão computacional." }
  ];

  const query = "Como a IA funciona";

  console.log(`Query: "${query}"`);

  // Generate embeddings
  console.log("Generating embeddings...");
  const queryEmbedding = await extractor(query, { pooling: 'mean', normalize: true });

  const results = [];

  for (const segment of segments) {
    const docEmbedding = await extractor(segment.text, { pooling: 'mean', normalize: true });

    // Calculate cosine similarity
    let dotProduct = 0;
    for (let i = 0; i < queryEmbedding.data.length; i++) {
        dotProduct += queryEmbedding.data[i] * docEmbedding.data[i];
    }

    results.push({
      ...segment,
      score: dotProduct
    });
  }

  // Sort by similarity score descending
  results.sort((a, b) => b.score - a.score);

  console.log("\nResults:");
  results.forEach(r => {
    console.log(`Score: ${r.score.toFixed(4)} | Text: ${r.text}`);
  });
}

testSemanticSearch().catch(console.error);
