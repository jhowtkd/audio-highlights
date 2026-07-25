const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

const inputVideo = path.join(tempDir, 'input.mp4');
const inputSrt = path.join(tempDir, 'subs.srt');
const outputVideo = path.join(tempDir, 'output.mp4');

let ffmpegPath = 'ffmpeg';
try {
    ffmpegPath = require('ffmpeg-static');
} catch (e) {
    console.log('ffmpeg-static not found, using global ffmpeg');
}

// Generate a 2-second dummy video if it doesn't exist
if (!fs.existsSync(inputVideo)) {
    console.log('Generating dummy video...');
    spawnSync(ffmpegPath, ['-y', '-f', 'lavfi', '-i', 'color=c=blue:s=320x240:d=2', inputVideo]);
}

// Generate dummy SRT
const srtContent = `1
00:00:00,000 --> 00:00:01,000
Testing burned-in

2
00:00:01,000 --> 00:00:02,000
subtitles!
`;
fs.writeFileSync(inputSrt, srtContent);

// Absolute path escaping for FFmpeg subtitles filter
const escapedSrtPath = path.resolve(inputSrt).replace(/\\/g, '/').replace(/:/g, '\\:');

const ffmpegArgs = [
    '-y',
    '-i', inputVideo,
    '-vf', `subtitles=${escapedSrtPath}:force_style='FontSize=24,PrimaryColour=&H00FFFF'`,
    '-c:a', 'copy',
    outputVideo
];

console.log('Executing FFmpeg command: ffmpeg', ffmpegArgs.join(' '));

const ffmpeg = spawn(ffmpegPath, ffmpegArgs);

let stderr = '';
ffmpeg.stderr.on('data', (data) => {
    stderr += data.toString();
});

ffmpeg.on('close', (code) => {
    if (code === 0) {
        console.log(`Success! Video saved to ${outputVideo}`);
        console.log(`File size: ${fs.statSync(outputVideo).size} bytes`);

        // Clean up
        fs.unlinkSync(inputVideo);
        fs.unlinkSync(inputSrt);
        fs.unlinkSync(outputVideo);
        fs.rmdirSync(tempDir);
    } else {
        console.error('FFmpeg failed with code', code);
        console.error(stderr);
    }
});
