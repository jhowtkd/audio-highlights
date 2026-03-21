import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const runFfmpeg = (args: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        // use ffmpeg-static from ffmpeg-service since we just npm installed it there, or just use node_modules path from root
        const ffmpegPath = path.resolve(process.cwd(), 'node_modules/ffmpeg-static/ffmpeg');

        console.log(`Running: ${ffmpegPath} ${args.join(' ')}`);

        const childProc = spawn(ffmpegPath, args);

        childProc.stderr.on('data', (data) => {
            // console.error(data.toString());
        });

        childProc.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });

        childProc.on('error', (err) => {
            reject(err);
        });
    });
};

async function createAudiogram() {
    const outputDir = path.resolve(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const audioFile = path.resolve(outputDir, 'test.mp3');
    const bgImage = path.resolve(outputDir, 'bg.jpg');
    const outputFile = path.resolve(outputDir, 'audiogram.mp4');

    try {
        console.log('Generating test audio...');
        await runFfmpeg([
            '-y',
            '-f', 'lavfi',
            '-i', 'sine=frequency=1000:duration=5',
            audioFile
        ]);

        console.log('Generating background image...');
        await runFfmpeg([
            '-y',
            '-f', 'lavfi',
            '-i', 'color=c=blue:s=1080x1920:d=1',
            '-frames:v', '1',
            bgImage
        ]);

        console.log('Creating audiogram...');
        await runFfmpeg([
            '-y',
            '-loop', '1',
            '-i', bgImage,
            '-i', audioFile,
            '-filter_complex', '[1:a]showwaves=s=1080x400:mode=cline:colors=white[wave]; [0:v][wave]overlay=0:H-h-200:shortest=1',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-c:a', 'aac',
            '-shortest',
            outputFile
        ]);

        console.log(`Success! Audiogram generated at ${outputFile}`);
    } catch (err) {
        console.error('Error generating audiogram:', err);
    }
}

createAudiogram();
