const ffmpegPath = require('ffmpeg-static');
const { spawn } = require('child_process');
const path = require('path');

const filename = path.join(__dirname, 'test_video.mp4');
const outputFilename = path.join(__dirname, 'test_video_cropped.mp4');

// Generate a dummy video (16:9, e.g. 1280x720)
function generateVideo() {
    return new Promise((resolve, reject) => {
        const args = [
            '-y',
            '-f', 'lavfi', '-i', 'testsrc=duration=5:size=1280x720:rate=30',
            '-c:v', 'libx264',
            filename
        ];
        console.log(`Generating test 16:9 video...`);
        const ffmpeg = spawn(ffmpegPath, args);
        ffmpeg.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Failed to generate video (code ${code})`));
        });
    });
}

function autoCropVideo(inputFile, outputFile) {
    return new Promise((resolve, reject) => {
        // Crop to 9:16 aspect ratio (e.g., 720 * 9 / 16 = 405 width, 720 height)
        // crop=w=ih*9/16:h=ih
        const args = [
            '-y',
            '-i', inputFile,
            '-vf', 'crop=ih*9/16:ih',
            '-c:a', 'copy',
            outputFile
        ];
        console.log(`Cropping video to 9:16...`);
        const ffmpeg = spawn(ffmpegPath, args);
        let stderr = '';
        ffmpeg.stderr.on('data', (d) => { stderr += d.toString(); });
        ffmpeg.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Failed to crop video (code ${code}): ${stderr}`));
        });
    });
}

async function run() {
    try {
        await generateVideo();
        await autoCropVideo(filename, outputFilename);
        console.log('Video cropped successfully! Output at', outputFilename);
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
