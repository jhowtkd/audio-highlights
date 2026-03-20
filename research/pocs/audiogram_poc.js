const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

async function createAudiogram(audioPath, imagePath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(imagePath)
            .loop(1)
            .input(audioPath)
            .complexFilter([
                '[1:a]showwaves=s=1280x200:colors=White:mode=line[wave]',
                '[0:v][wave]overlay=0:260[outv]'
            ])
            .outputOptions([
                '-map [outv]',
                '-map 1:a',
                '-c:v libx264',
                '-preset ultrafast',
                '-c:a aac',
                '-shortest'
            ])
            .save(outputPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err));
    });
}

async function run() {
    try {
        const audioPath = path.join(__dirname, 'dummy.mp3');
        const imagePath = path.join(__dirname, 'bg.png');
        const { spawnSync } = require('child_process');

        spawnSync(ffmpegPath, ['-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=5', audioPath]);
        console.log('Dummy audio created');

        // Fallback: Use ffmpeg to create a black image
        spawnSync(ffmpegPath, ['-y', '-f', 'lavfi', '-i', 'color=c=black:s=1280x720:d=1', '-frames:v', '1', imagePath]);
        console.log('Dummy image created');

        const outputPath = path.join(__dirname, 'audiogram_test.mp4');
        console.log('Creating audiogram...');
        await createAudiogram(audioPath, imagePath, outputPath);

        console.log('Done! Output saved to', outputPath);
    } catch (e) {
        console.error('Test failed', e);
    }
}

run();
