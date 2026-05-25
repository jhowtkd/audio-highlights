import { pipeline, env } from '@xenova/transformers';

// Disable downloading from Hugging Face since we are doing a quick local test
// in production we should load it locally or cache it
// env.allowLocalModels = false;

async function runPoc() {
    console.log("Loading model...");
    // Create an embedding pipeline
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    console.log("Model loaded!");

    const query = "financial advice";
    const sentences = [
        "I love watching movies on the weekend.",
        "To save money, you should invest in a low-cost index fund.",
        "The weather is very sunny today.",
        "Interest rates are going up next year."
    ];

    console.log("Embedding query:", query);
    const queryEmbedding = await extractor(query, { pooling: 'mean', normalize: true });

    console.log("Embedding sentences...");
    const sentenceEmbeddings = await extractor(sentences, { pooling: 'mean', normalize: true });

    // Compute cosine similarity
    const results = [];
    const queryData = queryEmbedding.data;

    // We assume sentenceEmbeddings.data is a flat Float32Array
    // Its dimensions are [batch_size, embedding_dim]
    const batchSize = sentenceEmbeddings.dims[0];
    const embeddingDim = sentenceEmbeddings.dims[1];

    for (let i = 0; i < batchSize; i++) {
        let dotProduct = 0;
        for (let j = 0; j < embeddingDim; j++) {
            dotProduct += queryData[j] * sentenceEmbeddings.data[i * embeddingDim + j];
        }
        results.push({
            sentence: sentences[i],
            similarity: dotProduct
        });
    }

    results.sort((a, b) => b.similarity - a.similarity);

    console.log("Results:");
    results.forEach(r => {
        console.log(`- ${r.sentence} (score: ${r.similarity.toFixed(4)})`);
    });
}

runPoc().catch(console.error);
