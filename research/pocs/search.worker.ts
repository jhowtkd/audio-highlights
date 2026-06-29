import { pipeline, env } from '@xenova/transformers';

// Disable local models, fetch from HF hub
env.allowLocalModels = false;

let extractor: any = null;

async function getExtractor() {
    if (!extractor) {
        extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return extractor;
}

self.addEventListener('message', async (e) => {
    const { type, text } = e.data;

    if (type === 'EMBED') {
        const extract = await getExtractor();
        const output = await extract(text, { pooling: 'mean', normalize: true });
        self.postMessage({ type: 'RESULT', embedding: Array.from(output.data) });
    }
});
