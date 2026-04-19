const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');

async function run() {
    console.log('Testing subtitle burning POC...');

    const testVideo = path.join(__dirname, 'test_vid.mp4');
    const testSrt = path.join(__dirname, 'test_sub.srt');
    const outVideo = path.join(__dirname, 'out_vid.mp4');

    // Create a 3s test video
    await new Promise((resolve, reject) => {
        const ff = spawn(ffmpegPath, [
            '-f', 'lavfi', '-i', 'testsrc=duration=3:size=640x360:rate=30',
            '-c:v', 'libx264', '-y', testVideo
        ]);
        ff.on('close', resolve);
        ff.on('error', reject);
    });

    // Create SRT
    fs.writeFileSync(testSrt, `1\n00:00:00,000 --> 00:00:01,500\nHello World!\n\n2\n00:00:01,500 --> 00:00:03,000\nBurning subtitles is fun!\n`);

    const start = performance.now();

    // Burn subtitles
    // Note: -vf subtitles requires path escaping, but simple relative/absolute works if no weird chars
    await new Promise((resolve, reject) => {
        const ff = spawn(ffmpegPath, [
            '-i', testVideo,
            '-vf', `subtitles=${testSrt}`,
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-y', outVideo
        ]);
        ff.stderr.on('data', d => console.log(d.toString()));
        ff.on('close', resolve);
        ff.on('error', reject);
    });

    const end = performance.now();
    console.log(`Burned subtitles in ${(end - start).toFixed(2)}ms`);

    if (fs.existsSync(outVideo)) {
        console.log(`Success! File size: ${fs.statSync(outVideo).size} bytes`);
    } else {
        console.log('Failed to create output video');
    }

    // Cleanup generated files
    fs.unlinkSync(testVideo);
    fs.unlinkSync(testSrt);
    fs.unlinkSync(outVideo);
}

run().catch(console.error);
