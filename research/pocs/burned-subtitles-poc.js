const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// This POC demonstrates how to burn subtitles into a video using ffmpeg

async function createPOC() {
    // 1. Create a dummy video (3 seconds, black screen, silent audio)
    console.log('Creating dummy video...');
    await runCommand('ffmpeg', [
        '-f', 'lavfi', '-i', 'color=c=black:s=1280x720:d=3',
        '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
        '-c:v', 'libx264', '-t', '3',
        '-c:a', 'aac', '-t', '3',
        '-y', 'dummy.mp4'
    ]);

    // 2. Create a dummy SRT file
    const srtContent = `1
00:00:00,000 --> 00:00:01,500
Hello World!

2
00:00:01,500 --> 00:00:03,000
This is a test subtitle.
`;
    fs.writeFileSync('dummy.srt', srtContent);

    // 3. Burn subtitles into the video
    console.log('Burning subtitles...');
    // Note: absolute path is usually needed for the subtitles filter and Windows paths need escaping
    const srtPath = path.resolve('dummy.srt').replace(/\\/g, '/').replace(/:/g, '\\:');

    await runCommand('ffmpeg', [
        '-y',
        '-i', 'dummy.mp4',
        '-vf', `subtitles=${srtPath}:force_style='FontSize=24,PrimaryColour=&H00FFFFFF'`,
        '-c:a', 'copy',
        'output_with_subs.mp4'
    ]);

    console.log('Done! Generated output_with_subs.mp4');
}

function runCommand(command, args) {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args);
        let stderr = '';
        proc.stderr.on('data', (data) => { stderr += data.toString(); });
        proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Command failed with code ${code}: ${stderr}`));
        });
    });
}

createPOC().catch(console.error);
