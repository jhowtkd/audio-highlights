const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('ffmpeg-static');

const srtContent = `1
00:00:00,000 --> 00:00:02,000
Hello World!

2
00:00:02,000 --> 00:00:04,000
This is a test subtitle.
`;

const srtPath = path.join(__dirname, 'test.srt');
fs.writeFileSync(srtPath, srtContent);
const outputPath = path.join(__dirname, 'output.mp4');

console.log('Generating video with burned-in subtitles...');

const result = spawnSync(ffmpeg, [
    '-f', 'lavfi',
    '-i', 'color=c=black:s=1280x720:d=5',
    '-vf', `subtitles=${srtPath}`,
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-y',
    outputPath
]);

if (result.status === 0) {
    console.log('Success! Video generated at:', outputPath);
    console.log('File size:', fs.statSync(outputPath).size, 'bytes');
} else {
    console.error('Error generating video:', result.stderr.toString());
}
