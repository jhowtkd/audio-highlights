const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

// Configure ffmpeg path
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
} else {
    console.warn('ffmpeg-static not found, relying on system ffmpeg');
}

const inputVideo = path.join(__dirname, 'dummy.mp4');
const inputSubtitles = path.join(__dirname, 'dummy.srt');
const outputVideo = path.join(__dirname, 'output.mp4');

// Escape subtitle path for ffmpeg filter
// Windows paths might need special escaping, but for standard unix paths this usually works
const escapedSubtitlePath = inputSubtitles.replace(/\\/g, '/').replace(/:/g, '\\:');

console.log(`Input video: ${inputVideo}`);
console.log(`Input subtitles: ${inputSubtitles}`);
console.log(`Output video: ${outputVideo}`);

if (!fs.existsSync(inputVideo)) {
    console.error(`Error: Input video not found at ${inputVideo}`);
    process.exit(1);
}

if (!fs.existsSync(inputSubtitles)) {
    console.error(`Error: Input subtitles not found at ${inputSubtitles}`);
    process.exit(1);
}

console.log('Starting video processing...');

ffmpeg(inputVideo)
    // The subtitles filter requires escaping colons and backslashes in paths
    .videoFilters(`subtitles='${escapedSubtitlePath}'`)
    .output(outputVideo)
    .on('end', () => {
        console.log('Processing finished successfully!');
        console.log(`Output saved to: ${outputVideo}`);
    })
    .on('error', (err) => {
        console.error('Error during processing:', err.message);
    })
    .run();
