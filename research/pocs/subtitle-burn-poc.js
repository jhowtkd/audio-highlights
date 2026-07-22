const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');

async function createTestVideo(outputPath) {
    return new Promise((resolve, reject) => {
        const args = [
            '-f', 'lavfi', '-i', 'color=c=red:s=1280x720:d=5',
            '-c:v', 'libx264', '-y', outputPath
        ];
        const child = spawn(ffmpegPath, args);
        child.on('close', (code) => code === 0 ? resolve() : reject(new Error('Failed to create test video')));
    });
}

async function burnSubtitles(inputVideo, subtitleFile, outputVideo) {
    return new Promise((resolve, reject) => {
        const escapedSubtitlePath = subtitleFile.replace(/\\/g, '/').replace(/:/g, '\\:');
        const args = [
            '-i', inputVideo,
            '-vf', `subtitles=${escapedSubtitlePath}`,
            '-c:a', 'copy',
            '-y', outputVideo
        ];
        console.log('Running FFmpeg with args:', args.join(' '));
        const child = spawn(ffmpegPath, args);
        let stderr = '';
        child.stderr.on('data', data => stderr += data.toString());
        child.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error('Failed to burn subtitles: ' + stderr));
        });
    });
}

async function run() {
    const inputVid = path.join(__dirname, 'test_input.mp4');
    const srtPath = path.join(__dirname, 'test.srt');
    const outputVid = path.join(__dirname, 'test_output_subbed.mp4');

    fs.writeFileSync(srtPath, `1\n00:00:00,000 --> 00:00:02,500\nHello World! This is a test.\n\n2\n00:00:02,500 --> 00:00:05,000\nBurning subtitles is awesome!\n`);

    console.log('Creating test video...');
    await createTestVideo(inputVid);

    console.log('Burning subtitles...');
    const start = performance.now();
    await burnSubtitles(inputVid, srtPath, outputVid);
    const end = performance.now();

    console.log(`Subtitles burned successfully in ${(end - start).toFixed(2)}ms`);

    fs.unlinkSync(inputVid);
    fs.unlinkSync(srtPath);
    fs.unlinkSync(outputVid);
}

run().catch(console.error);