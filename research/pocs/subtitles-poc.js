const ffmpegPath = require('ffmpeg-static');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const videoFile = path.join(__dirname, 'test_video.mp4');
const srtFile = path.join(__dirname, 'test_subtitles.srt');
const outputFile = path.join(__dirname, 'test_output.mp4');

function generateTestFiles() {
    return new Promise((resolve, reject) => {
        // Generate a 5-second test video
        const args = [
            '-y',
            '-f', 'lavfi', '-i', 'testsrc=duration=5:size=640x360:rate=30',
            '-c:v', 'libx264',
            videoFile
        ];
        const ffmpeg = spawn(ffmpegPath, args);
        ffmpeg.on('close', (code) => {
            if (code === 0) {
                // Generate a simple SRT file
                const srtContent = `1
00:00:01,000 --> 00:00:03,000
Hello World!

2
00:00:03,500 --> 00:00:04,500
Testing subtitles...
`;
                fs.writeFileSync(srtFile, srtContent);
                resolve();
            } else {
                reject(new Error(`Failed to generate video (code ${code})`));
            }
        });
    });
}

function burnSubtitles() {
    return new Promise((resolve, reject) => {
        // Path escaping for FFmpeg subtitles filter
        const escapedSrtPath = srtFile.replace(/\\/g, '\\\\').replace(/:/g, '\\:');

        const args = [
            '-y',
            '-i', videoFile,
            '-vf', `subtitles=${escapedSrtPath}`,
            '-c:a', 'copy',
            '-c:v', 'libx264', // Must re-encode video
            outputFile
        ];

        console.time('Burn Subtitles');
        const ffmpeg = spawn(ffmpegPath, args);

        ffmpeg.on('close', (code) => {
            console.timeEnd('Burn Subtitles');
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Failed to burn subtitles (code ${code})`));
            }
        });
    });
}

async function run() {
    try {
        console.log('Generating test files...');
        await generateTestFiles();
        console.log('Burning subtitles...');
        await burnSubtitles();
        console.log('Success! Output saved to', outputFile);
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
