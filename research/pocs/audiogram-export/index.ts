import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Proof of Concept: Audiogram Generation using FFmpeg
 *
 * This script demonstrates how to generate a video audiogram (waveform animation)
 * from an audio file using FFmpeg's `showwaves` filter.
 */

// Use the local FFmpeg static binary that's likely installed as a dependency
const ffmpegPath = require('ffmpeg-static') as string;

async function generateAudiogram(inputAudio: string, outputVideo: string) {
    console.log(`Generating audiogram from ${inputAudio}...`);

    // Ensure input exists (for testing, create a dummy audio file if it doesn't)
    if (!fs.existsSync(inputAudio)) {
        console.log('Input audio not found, creating a 5-second test tone...');
        await new Promise<void>((resolve, reject) => {
            const createAudio = spawn(ffmpegPath, [
                '-y',
                '-f', 'lavfi', '-i', 'sine=frequency=440:duration=5', '-c:a', 'libmp3lame', inputAudio
            ]);
            let stderr = '';
            createAudio.stderr.on('data', data => { stderr += data.toString(); });
            createAudio.on('close', code => {
                if (code === 0) resolve();
                else {
                    console.error('Test audio creation failed:', stderr);
                    reject(new Error(`Failed to create test audio, code ${code}`));
                }
            });
        });
    }

    return new Promise<void>((resolve, reject) => {
        // Dimensions for a typical mobile short (9:16)
        const width = 1080;
        const height = 1920;
        const bgColor = 'black';
        const waveColor = 'white';

        // FFmpeg complex filtergraph to:
        // 1. Create a background canvas.
        // 2. Generate a waveform from the audio.
        // 3. Overlay the waveform onto the background.
        const ffmpeg = spawn(ffmpegPath, [
            '-y',
            '-i', inputAudio,
            '-f', 'lavfi',
            '-i', `color=c=${bgColor}:s=${width}x${height}`,
            '-filter_complex', `[0:a]showwaves=s=${width}x400:colors=${waveColor}:mode=cline,format=yuv420p[wave];[1:v][wave]overlay=0:(H-h)/2[outv]`,
            '-map', '[outv]',
            '-map', '0:a',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-c:a', 'aac',
            '-shortest',
            outputVideo
        ]);

        let stderr = '';
        ffmpeg.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ Audiogram generated successfully: ${outputVideo}`);
                resolve();
            } else {
                console.error('❌ FFmpeg failed with code:', code);
                console.error(stderr);
                reject(new Error(`FFmpeg error: ${code}`));
            }
        });
    });
}

// Run the POC
const inputAudioPath = path.resolve('test_input.mp3');
const outputVideoPath = path.resolve('test_output.mp4');

generateAudiogram(inputAudioPath, outputVideoPath)
    .then(() => {
        console.log('POC completed. Check the generated video file.');
        // Clean up dummy audio if we created it
        if (fs.existsSync(inputAudioPath)) {
            fs.unlinkSync(inputAudioPath);
        }
        // Clean up output video
        if (fs.existsSync(outputVideoPath)) {
            fs.unlinkSync(outputVideoPath);
        }
    })
    .catch(err => console.error(err));
