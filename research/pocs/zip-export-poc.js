const fs = require('fs');
const JSZip = require('jszip');

async function createZipPOC() {
    console.log('Starting JSZip POC...');
    const zip = new JSZip();

    // Mock Highlight Data
    const mockHighlight = {
        title: "The Future of AI",
        transcript: "Artificial intelligence is rapidly evolving and will change how we work.",
        audioData: Buffer.from("mock audio binary data chunk 101010101"),
    };

    // 1. Add Text File (Markdown)
    const markdownContent = `# ${mockHighlight.title}\n\n${mockHighlight.transcript}`;
    zip.file("highlight_info.md", markdownContent);
    console.log('Added highlight_info.md to zip.');

    // 2. Add Binary File (Mock MP3)
    zip.file("clip.mp3", mockHighlight.audioData);
    console.log('Added clip.mp3 to zip.');

    // 3. Generate ZIP buffer (using nodebuffer for Node.js environment)
    // Note: In browser, you would use type: "blob"
    console.log('Generating ZIP file...');
    const content = await zip.generateAsync({ type: "nodebuffer" });

    // 4. Save to disk to verify
    const outputPath = 'test_export.zip';
    fs.writeFileSync(outputPath, content);
    console.log(`ZIP file created successfully at: ${outputPath}`);
}

createZipPOC().catch(console.error);
