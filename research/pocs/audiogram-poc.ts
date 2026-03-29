import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Proof of Concept: Server-Side Audiogram Generation
 *
 * This script demonstrates how to generate a video audiogram (waveform visualization)
 * from an audio file and a static background image using FFmpeg's `showwaves` filter.
 * It uses native `child_process.spawn` with `ffmpeg-static` for optimal performance.
 */

async function generateAudiogram(
    audioPath: string,
    imagePath: string,
    outputPath: string,
    options: {
        width?: number;
        height?: number;
        color?: string;
    } = {}
): Promise<void> {
    const {
        width = 1080,
        height = 1920,
        color = 'white'
    } = options;

    return new Promise((resolve, reject) => {
        if (!ffmpegStatic) {
            return reject(new Error('ffmpeg-static binary not found.'));
        }

        console.log(`[Audiogram POC] Starting generation for ${audioPath}...`);

        // FFmpeg command breakdown:
        // -loop 1 -i imagePath: Loops the static background image indefinitely.
        // -i audioPath: The input audio file.
        // -filter_complex:
        //   1. [1:a]showwaves=s=${width}x${height/3}:colors=${color}:mode=cline[wave]; -> Generates waveform from audio stream 1.
        //   2. [0:v][wave]overlay=0:H-h-100[outv]; -> Overlays waveform on image stream 0 near the bottom.
        // -map "[outv]" -map 1:a: Maps the complex filter output and original audio to final file.
        // -c:v libx264: Encodes video using H.264.
        // -pix_fmt yuv420p: Ensures compatibility across devices.
        // -shortest: Stops encoding when the shortest input (audio) ends.

        const args = [
            '-y', // Overwrite output
            '-loop', '1', // Loop the image
            '-i', imagePath, // Input 0: Image
            '-i', audioPath, // Input 1: Audio
            '-filter_complex', `[1:a]showwaves=s=${width}x${Math.floor(height / 4)}:colors=${color}:mode=cline[wave];[0:v][wave]overlay=0:H-h-200:shortest=1[outv]`,
            '-map', '[outv]', // Use output of complex filter
            '-map', '1:a', // Use original audio
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac', // Encode audio to AAC
            '-b:a', '192k',
            '-shortest', // Stop when shortest stream (audio) ends
            outputPath
        ];

        const ffmpegProcess = spawn(ffmpegStatic, args);

        let stderr = '';

        ffmpegProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        ffmpegProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`[Audiogram POC] Successfully generated audiogram at ${outputPath}`);
                resolve();
            } else {
                console.error(`[Audiogram POC] FFmpeg process exited with code ${code}`);
                console.error(`[Audiogram POC] Error details:\n${stderr}`);
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });

        ffmpegProcess.on('error', (err) => {
            console.error(`[Audiogram POC] Failed to start FFmpeg process:`, err);
            reject(err);
        });
    });
}

// Example Usage (can be run with ts-node if test files exist):
// async function runDemo() {
//    const testAudio = path.join(__dirname, 'test.mp3');
//    const testImage = path.join(__dirname, 'background.png');
//    const outputVideo = path.join(__dirname, 'output.mp4');
//
//    if (fs.existsSync(testAudio) && fs.existsSync(testImage)) {
//        await generateAudiogram(testAudio, testImage, outputVideo);
//    } else {
//        console.log('[Audiogram POC] Skipping runDemo: Provide test.mp3 and background.png in the same directory.');
//    }
// }
// runDemo().catch(console.error);

export { generateAudiogram };
