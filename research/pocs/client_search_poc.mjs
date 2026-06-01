import { pipeline } from '@xenova/transformers';

async function run() {
    console.log("Loading model...");
    const startTime = Date.now();
    // Use a lightweight feature extraction model
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true, // Use quantized version for browser
    });
    console.log(`Model loaded in ${Date.now() - startTime}ms`);

    const segments = [
        "Bem-vindo ao nosso podcast sobre tecnologia.",
        "Hoje vamos falar sobre inteligência artificial e aprendizado de máquina.",
        "Muitas empresas estão adotando modelos de linguagem.",
        "O custo de APIs externas pode ser muito alto para startups.",
        "Rodar modelos no cliente reduz custos e melhora a privacidade.",
        "A receita do bolo de chocolate é muito simples."
    ];

    console.log("Generating embeddings for segments...");
    const startEmbedTime = Date.now();
    const segmentEmbeddings = [];
    for (const text of segments) {
        const output = await extractor(text, { pooling: 'mean', normalize: true });
        segmentEmbeddings.push({ text, embedding: Array.from(output.data) });
    }
    console.log(`Embeddings generated in ${Date.now() - startEmbedTime}ms`);

    const query = "Como economizar dinheiro e evitar gastos na nuvem?";
    console.log(`\nQuery: "${query}"`);

    const queryOutput = await extractor(query, { pooling: 'mean', normalize: true });
    const queryEmbedding = Array.from(queryOutput.data);

    // Simple cosine similarity
    function cosineSimilarity(vecA, vecB) {
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

    const results = segmentEmbeddings.map(item => ({
        text: item.text,
        score: cosineSimilarity(queryEmbedding, item.embedding)
    })).sort((a, b) => b.score - a.score);

    console.log("\nResults:");
    results.forEach(r => console.log(`- Score: ${r.score.toFixed(4)} | ${r.text}`));
}

run().catch(console.error);