
import { pipeline } from '@xenova/transformers';

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

async function runPOC() {
    console.log('🚀 Starting Semantic Search POC...');
    const startTime = performance.now();

    // 1. Load the model
    console.log('📦 Loading model (Xenova/all-MiniLM-L6-v2)...');
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log(`✅ Model loaded in ${((performance.now() - startTime) / 1000).toFixed(2)}s`);

    // 2. Sample Data (Simulated Transcript Segments)
    const segments = [
        { id: 1, text: "Welcome to our podcast about artificial intelligence and the future of work." },
        { id: 2, text: "Today we will discuss how machine learning models are trained using large datasets." },
        { id: 3, text: "Let's take a break and talk about the weather. It's sunny outside." },
        { id: 4, text: "The economic impact of automation is a major concern for policymakers." },
        { id: 5, text: "I love drinking coffee in the morning while reading the news." }
    ];

    const queries = [
        "AI technology",
        "money and jobs",
        "morning routine"
    ];

    // 3. Generate Embeddings for Segments
    console.log('\n📊 Generating embeddings for segments...');
    const segmentEmbeddings = [];
    for (const segment of segments) {
        const output = await extractor(segment.text, { pooling: 'mean', normalize: true });
        // @ts-expect-error - output.data is Float32Array
        segmentEmbeddings.push({ ...segment, embedding: Array.from(output.data) });
    }

    // 4. Run Search Queries
    console.log('\n🔍 Running search queries...');

    for (const query of queries) {
        console.log(`\nQuery: "${query}"`);
        const queryStart = performance.now();

        const output = await extractor(query, { pooling: 'mean', normalize: true });
        // @ts-expect-error - output.data is Float32Array
        const queryEmbedding = Array.from(output.data);

        const results = segmentEmbeddings.map(segment => ({
            text: segment.text,
            score: cosineSimilarity(queryEmbedding as number[], segment.embedding as number[])
        })).sort((a, b) => b.score - a.score);

        const queryTime = performance.now() - queryStart;

        // Print top match
        const topMatch = results[0];
        console.log(`   Top Match (Score: ${topMatch.score.toFixed(4)}): "${topMatch.text}"`);
        console.log(`   Time: ${queryTime.toFixed(2)}ms`);
    }

    const totalTime = performance.now() - startTime;
    console.log(`\n✨ POC Completed in ${(totalTime / 1000).toFixed(2)}s`);
}

runPOC().catch(console.error);
