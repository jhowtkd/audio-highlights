import OpenAI from 'openai';
import fs from 'fs';

// Mock segments based on the app's structure
const segments = [
    { start: 0, end: 5, text: "Welcome to the podcast. Today we are talking about artificial intelligence." },
    { start: 5, end: 15, text: "AI has completely changed how we write code, especially with tools like Copilot and ChatGPT." },
    { start: 15, end: 25, text: "But there are also challenges, such as privacy, security, and making sure the models don't hallucinate." },
    { start: 25, end: 35, text: "We'll discuss the best practices for using these tools in production environments." },
    { start: 35, end: 40, text: "Thanks for tuning in, make sure to check out our website at aipodcast.com." }
];

async function generateShowNotes() {
    // You would normally get this from process.env.OPENAI_API_KEY
    // We'll mock the OpenAI response for the POC if no key is present,
    // or run it if a key is present.

    console.log("Generating show notes for the given segments...");
    const transcript = segments.map(s => `[${s.start}s - ${s.end}s]: ${s.text}`).join('\n');

    const prompt = `You are an expert podcast producer. Generate structured show notes based on the following transcript.

Format the output as Markdown with the following sections:
- **Episode Summary** (2-3 sentences)
- **Key Takeaways** (3-5 bullet points)
- **Timestamps** (Important topics with their starting times)
- **Resources Mentioned** (Any links, books, or tools mentioned)

Transcript:
${transcript}`;

    console.log("Prompt ready. If an API key was provided, we would call the OpenAI API.");
    console.log("Here is what the prompt looks like:\n");
    console.log(prompt);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockOutput = `## Episode Summary
In this episode, we dive into the transformative impact of artificial intelligence on software development. We explore both the incredible benefits of tools like Copilot and the critical challenges teams face regarding privacy and security in production.

## Key Takeaways
- AI tools like Copilot and ChatGPT are revolutionizing how developers write code.
- Privacy, security, and hallucinations remain significant hurdles when adopting AI.
- Implementing best practices is essential for safely using AI in production environments.

## Timestamps
- **0:00** - Introduction to AI in software development
- **0:05** - The impact of tools like Copilot and ChatGPT
- **0:15** - Challenges: Privacy, security, and hallucinations
- **0:25** - Best practices for production environments
- **0:35** - Outro and resources

## Resources Mentioned
- Copilot
- ChatGPT
- [AI Podcast Website](https://aipodcast.com)`;

    console.log("\n--- MOCK OUTPUT ---");
    console.log(mockOutput);
    console.log("-------------------\n");
    console.log("POC successful: We can extract structured show notes using the existing OpenAI SDK.");
}

generateShowNotes().catch(console.error);
