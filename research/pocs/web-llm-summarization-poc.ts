// research/pocs/web-llm-summarization-poc.ts
// This is a minimal proof of concept for using @mlc-ai/web-llm to perform client-side highlight generation.

import { CreateMLCEngine, InitProgressReport } from "@mlc-ai/web-llm";

/**
 * Proof of concept component for local LLM generation.
 * This code demonstrates how to initialize the WebLLM engine, load a model,
 * and prompt it to generate highlights from a transcript, all running locally in the browser.
 */

async function main() {
  const initProgressCallback = (initProgress: InitProgressReport) => {
    console.log("Loading Model:", initProgress.text, `${Math.round(initProgress.progress * 100)}%`);
  };

  const selectedModel = "Llama-3-8B-Instruct-q4f32_1-MLC"; // Uses 4-bit quantization, small enough for many laptops/desktops

  try {
    console.log("Initializing WebLLM Engine...");

    // Engine creation automatically handles WebGPU detection, model downloading, and caching.
    const engine = await CreateMLCEngine(selectedModel, { initProgressCallback });

    console.log("Engine initialized. Ready for inference.");

    const sampleTranscript = `
      So today we're going to talk about the new architecture. It really simplifies our deployment process.
      Instead of manual scripts, we've moved to a fully declarative infrastructure setup using Terraform.
      This means we can spin up environments in minutes rather than hours.
      It also reduces the chance of human error significantly.
      Overall, the team has been very happy with the transition, though the learning curve was a bit steep initially.
    `;

    const prompt = `
      Analyze the following transcript and extract the key highlights.
      Format the output as a JSON array of objects, where each object has a "title" and a "summary".

      Transcript:
      ${sampleTranscript}
    `;

    console.log("Sending prompt to local model...");

    const reply = await engine.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful AI assistant that extracts key highlights from transcripts and outputs valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 512,
    });

    console.log("Response received:");
    console.log(reply.choices[0].message.content);

    // Clean up resources when done
    engine.unload();

  } catch (error) {
    console.error("Failed to run WebLLM POC. Ensure your browser supports WebGPU and you have sufficient VRAM.", error);
  }
}

// In a real browser environment, you would call this function tied to a UI button.
// For the POC, we just define the logic.
export { main };
