const ffmpegPath = require('ffmpeg-static');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const audioPath = path.join(__dirname, 'test_audio.wav');
const imagePath = path.join(__dirname, 'test_bg.png');
const outputPath = path.join(__dirname, 'test_audiogram.mp4');

// Utility to run ffmpeg commands
function runFfmpeg(args, description) {
    return new Promise((resolve, reject) => {
        console.log(`Starting: ${description}`);
        const ffmpeg = spawn(ffmpegPath, args);

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                console.log(`Success: ${description}`);
                resolve();
            } else {
                reject(new Error(`FFmpeg failed with code ${code}`));
            }
        });
    });
}

async function prepareAssets() {
    // Generate a 5-second sine wave audio
    if (!fs.existsSync(audioPath)) {
        await runFfmpeg([
            '-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=5', audioPath
        ], 'Generate Test Audio');
    }

    // Generate a 1080x1920 static background image (blue)
    if (!fs.existsSync(imagePath)) {
        await runFfmpeg([
            '-y', '-f', 'lavfi', '-i', 'color=c=0x1e293b:s=1080x1920', '-vframes', '1', imagePath
        ], 'Generate Test Background Image');
    }
}

async function generateAudiogram() {
    // Generate audiogram:
    // 1. Loop the background image
    // 2. Add the audio
    // 3. Generate a waveform from the audio and overlay it
    // Filter complex:
    // [1:a]showwaves=s=1080x400:colors=White:mode=cline,format=yuv420p[wave];
    // [0:v][wave]overlay=0:H/2-h/2[outv]

    const args = [
        '-y',
        '-loop', '1', '-i', imagePath,
        '-i', audioPath,
        '-filter_complex', '[1:a]showwaves=s=1080x400:colors=White:mode=cline,format=yuva420p[wave];[0:v][wave]overlay=0:(H-h)/2[outv]',
        '-map', '[outv]',
        '-map', '1:a',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '22',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        outputPath
    ];

    await runFfmpeg(args, 'Generate Audiogram');
    console.log(`Audiogram generated successfully at: ${outputPath}`);
}

async function run() {
    try {
        await prepareAssets();
        await generateAudiogram();
    } catch (error) {
        console.error('Error during POC:', error);
    }
}

run();
