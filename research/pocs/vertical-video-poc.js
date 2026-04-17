const ffmpegPath = require('ffmpeg-static');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'test_input.mp4');
const outputFileCenter = path.join(__dirname, 'output_center_crop.mp4');
const outputFileBlur = path.join(__dirname, 'output_blur_bg.mp4');

// Generate a synthetic 16:9 video for testing (1280x720, 3 seconds)
function generateTestVideo() {
    return new Promise((resolve, reject) => {
        const args = [
            '-y',
            '-f', 'lavfi', '-i', 'testsrc=duration=3:size=1280x720:rate=30',
            '-c:v', 'libx264',
            inputFile
        ];
        console.log('Generating test video...');
        const ffmpeg = spawn(ffmpegPath, args);
        ffmpeg.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Failed to generate test video (code ${code})`));
        });
    });
}

// Center crop to 9:16
function cropVerticalCenter() {
    return new Promise((resolve, reject) => {
        const args = [
            '-y',
            '-i', inputFile,
            '-vf', 'crop=ih*9/16:ih',
            '-c:a', 'copy',
            outputFileCenter
        ];
        console.log('Cropping center...');
        const ffmpeg = spawn(ffmpegPath, args);
        ffmpeg.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Failed to center crop (code ${code})`));
        });
    });
}

// Blur background (fit original video inside 9:16 with blurred background)
function cropVerticalBlurBg() {
    return new Promise((resolve, reject) => {
        // Complex filter:
        // 1. Split input into two streams
        // 2. Scale first stream to 9:16 (by cropping sides and scaling up, or just scaling and blurring)
        // Let's do: Scale to target height, crop to target width, blur = background
        // Scale second stream to fit within target width = foreground
        // Overlay foreground onto background
        const args = [
            '-y',
            '-i', inputFile,
            '-filter_complex', '[0:v]scale=-1:1280,crop=720:1280,boxblur=20:20[bg];[0:v]scale=720:-1[fg];[bg][fg]overlay=0:(H-h)/2',
            '-c:a', 'copy',
            outputFileBlur
        ];
        console.log('Creating blurred background version...');
        const ffmpeg = spawn(ffmpegPath, args);
        ffmpeg.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Failed to create blur bg (code ${code})`));
        });
    });
}

async function run() {
    try {
        await generateTestVideo();
        await cropVerticalCenter();
        await cropVerticalBlurBg();
        console.log('POC completed successfully!');
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
