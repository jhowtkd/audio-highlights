const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const ffmpegStatic = require('ffmpeg-static');

// Mock data for POC
const SRT_CONTENT = `1
00:00:00,000 --> 00:00:02,500
Este é um teste de legenda

2
00:00:02,500 --> 00:00:05,000
Quebrada na segunda linha
`;

async function createTestVideo(outputPath) {
    console.log('Generating test video...');
    return new Promise((resolve, reject) => {
        // Generate a 5-second video with a test pattern and sine wave audio
        const ffmpeg = spawn(ffmpegStatic, [
            '-y',
            '-f', 'lavfi', '-i', 'testsrc=duration=5:size=1280x720:rate=30',
            '-f', 'lavfi', '-i', 'sine=frequency=440:duration=5',
            '-c:v', 'libx264', '-preset', 'ultrafast',
            '-c:a', 'aac',
            outputPath
        ]);

        ffmpeg.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error('Failed to create test video'));
        });

        ffmpeg.stderr.on('data', (data) => {
           // console.log(data.toString());
        });
    });
}

async function burnSubtitles(inputVideo, srtContent, outputPath) {
    console.log('Burning subtitles...');
    return new Promise(async (resolve, reject) => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'burnt-sub-poc-'));
        const srtPath = path.join(tempDir, 'subs.srt');

        // 1. Write SRT to temp file
        fs.writeFileSync(srtPath, srtContent);

        // 2. Escape path for FFmpeg filter
        // FFmpeg filter syntax requires escaping colons and backslashes
        const escapedSrtPath = srtPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');

        // 3. Run FFmpeg to burn subtitles
        // We MUST re-encode video (-c:v libx264) when using filters (-vf)
        const ffmpeg = spawn(ffmpegStatic, [
            '-y',
            '-i', inputVideo,
            '-vf', `subtitles='${escapedSrtPath}':force_style='Fontname=Arial,Fontsize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2'`,
            '-c:a', 'copy', // We can copy audio to save time
            '-c:v', 'libx264',
            '-preset', 'fast', // Balance between speed and compression
            outputPath
        ]);

        let stderr = '';
        ffmpeg.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        ffmpeg.on('close', (code) => {
            // Cleanup
            fs.rmSync(tempDir, { recursive: true, force: true });

            if (code === 0) {
                console.log('Success! Subtitles burnt into video.');
                resolve();
            } else {
                console.error('FFmpeg Error:', stderr);
                reject(new Error('Failed to burn subtitles'));
            }
        });
    });
}

async function main() {
    const INPUT_FILE = path.join(__dirname, 'poc_input.mp4');
    const OUTPUT_FILE = path.join(__dirname, 'poc_output.mp4');

    try {
        await createTestVideo(INPUT_FILE);
        console.log(`Created test video: ${INPUT_FILE}`);

        console.time('Burning Time');
        await burnSubtitles(INPUT_FILE, SRT_CONTENT, OUTPUT_FILE);
        console.timeEnd('Burning Time');

        console.log(`Generated output video with subtitles: ${OUTPUT_FILE}`);

        // Cleanup input file after POC
        fs.unlinkSync(INPUT_FILE);
        console.log('POC finished successfully.');
    } catch (error) {
        console.error('POC Error:', error);
    }
}

main();
