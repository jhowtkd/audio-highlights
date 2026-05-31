import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1/dist/transformers.min.js';

// Disable local models since we are running in browser from CDN
env.allowLocalModels = false;

class PipelineSingleton {
    static task = 'feature-extraction';
    static model = 'Xenova/all-MiniLM-L6-v2';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

self.addEventListener('message', async (event) => {
    try {
        let extractor = await PipelineSingleton.getInstance(x => {
            self.postMessage(x);
        });

        let output = await extractor(event.data.text, {
            pooling: 'mean',
            normalize: true,
        });

        self.postMessage({
            status: 'complete',
            output: output.tolist(),
        });
    } catch (err) {
        self.postMessage({ status: 'error', error: err.message });
    }
});
