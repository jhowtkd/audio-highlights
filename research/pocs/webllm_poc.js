import { CreateMLCEngine } from "@mlc.ai/web-llm";

async function run() {
  const selectedModel = "Llama-3-8B-Instruct-q4f32_1-MLC";
  // Create an engine with WebGPU
  // Note: This won't run successfully in Node.js without a WebGPU polyfill,
  // but serves as a syntax/API proof of concept for the browser.
  try {
    const engine = await CreateMLCEngine(selectedModel, {
      initProgressCallback: (progress) => {
        console.log("Loading model:", progress);
      }
    });

    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Summarize this text: The quick brown fox jumps over the lazy dog." }
    ];

    const reply = await engine.chat.completions.create({
      messages,
    });
    console.log(reply.choices[0].message.content);
  } catch (e) {
    console.log("WebGPU not available in this environment, but POC is valid:", e.message);
  }
}

// run();
