const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

async function runPOC() {
    const videoFile = path.join(__dirname, 'test_video.mp4');
    const srtFile = path.join(__dirname, 'test_subtitles.srt');
    const outputFile = path.join(__dirname, 'output_video.mp4');

    // 1. Generate a dummy test video
    console.log('Generating dummy video...');
    await new Promise((resolve, reject) => {
        const ffmpeg = spawn(ffmpegPath, [
            '-f', 'lavfi', '-i', 'testsrc=duration=5:size=1280x720:rate=30',
            '-f', 'lavfi', '-i', 'sine=frequency=1000:duration=5',
            '-c:v', 'libx264', '-c:a', 'aac',
            '-y', videoFile
        ]);
        ffmpeg.on('close', (code) => code === 0 ? resolve() : reject(new Error('Failed to generate video')));
    });

    // 2. Create a dummy SRT file
    const srtContent = `1
00:00:00,000 --> 00:00:02,500
This is an amazing highlight!

2
00:00:02,500 --> 00:00:05,000
Automatically generated subtitles.`;
    fs.writeFileSync(srtFile, srtContent);

    console.log('Burning subtitles into video...');
    const startTime = performance.now();

    // The memory rule: "When using the FFmpeg subtitles filter, ensure the subtitle file path is an absolute path and that colons and backslashes are properly escaped (e.g., path.replace(/\\/g, '\\\\').replace(/:/g, '\\:')) to prevent path resolution and parsing errors."
    const escapedSrtPath = srtFile.replace(/\\/g, '\\\\').replace(/:/g, '\\:');

    await new Promise((resolve, reject) => {
        const ffmpeg = spawn(ffmpegPath, [
            '-i', videoFile,
            '-vf', `subtitles='${escapedSrtPath}':force_style='FontSize=24,PrimaryColour=&H00FFFF&,BorderStyle=3,Outline=2,Shadow=1'`,
            '-c:a', 'copy',
            '-y', outputFile
        ]);

        ffmpeg.stderr.on('data', (data) => {
            // console.log(data.toString());
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error('Failed to burn subtitles'));
        });
    });

    const duration = performance.now() - startTime;
    console.log(`Success! Video saved to ${outputFile}`);
    console.log(`Processing time: ${(duration/1000).toFixed(2)}s`);
}

runPOC().catch(console.error);
