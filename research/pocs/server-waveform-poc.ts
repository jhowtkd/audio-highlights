
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { PassThrough } from 'stream';
import ffmpegPath from 'ffmpeg-static';

if (!ffmpegPath) {
    console.error('ffmpeg-static not found');
    process.exit(1);
}

// Helper to spawn ffmpeg
function runFFmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const child = spawn(ffmpegPath!, args);

        child.stderr.on('data', (data) => {
            // console.log(`ffmpeg: ${data}`); // Verbose
        });

        child.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`ffmpeg exited with code ${code}`));
        });

        child.on('error', reject);
    });
}

async function generateTestAudio(durationSeconds: number, outputPath: string): Promise<void> {
    console.log(`Generating ${durationSeconds}s test audio...`);
    // ffmpeg -f lavfi -i sine=frequency=1000:duration=${duration} -f mp3 -y ${outputPath}
    await runFFmpeg([
        '-f', 'lavfi',
        '-i', `sine=frequency=1000:duration=${durationSeconds}`,
        '-f', 'mp3',
        '-y', outputPath
    ]);
}

/**
 * Generates waveform peaks from an audio file using spawn + pipe.
 */
async function generateWaveformPeaks(inputPath: string, samplesPerPixel: number = 100): Promise<number[]> {
    return new Promise((resolve, reject) => {
        const peaks: number[] = [];

        const SAMPLE_RATE = 8000;
        const CHANNELS = 1;

        // ffmpeg -i input.mp3 -ac 1 -ar 8000 -f s16le -
        const args = [
            '-i', inputPath,
            '-ac', CHANNELS.toString(),
            '-ar', SAMPLE_RATE.toString(),
            '-f', 's16le',
            '-'
        ];

        const child = spawn(ffmpegPath!, args);

        child.stderr.on('data', () => {}); // Ignore stderr

        const stream = child.stdout;

        // Process data chunk by chunk
        stream.on('data', (chunk: Buffer) => {
            // Each sample is 2 bytes (16-bit)
            for (let i = 0; i < chunk.length; i += 2) {
                if (i + 1 >= chunk.length) break;

                const sample = chunk.readInt16LE(i);
                const normalized = sample / 32768.0;
                peaks.push(normalized);
            }
        });

        stream.on('end', () => {
            // Downsample
            const windowSize = Math.floor(SAMPLE_RATE / samplesPerPixel);
            const downsampled: number[] = [];

            for (let i = 0; i < peaks.length; i += windowSize) {
                let max = 0;
                for (let j = 0; j < windowSize && i + j < peaks.length; j++) {
                    const val = Math.abs(peaks[i + j]);
                    if (val > max) max = val;
                }
                downsampled.push(Number(max.toFixed(4)));
            }

            resolve(downsampled);
        });

        child.on('error', reject);
    });
}

async function run() {
    const testFile = path.join(process.cwd(), 'test_audio_1min.mp3');
    const duration = 60; // 1 minute

    try {
        if (fs.existsSync(testFile)) fs.unlinkSync(testFile);

        const genStart = performance.now();
        await generateTestAudio(duration, testFile);
        console.log(`Test file ready in ${(performance.now() - genStart).toFixed(0)}ms`);

        const stats = fs.statSync(testFile);
        console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);

        console.log('Generating peaks (target: 100 peaks/sec)...');
        const start = performance.now();

        const peaks = await generateWaveformPeaks(testFile, 100);

        const end = performance.now();

        console.log('\n--- Benchmark Results ---');
        console.log(`Input Duration: ${duration}s`);
        console.log(`Generation Time: ${(end - start).toFixed(2)} ms`);
        console.log(`Peaks generated: ${peaks.length}`);
        console.log(`JSON Size (approx): ${(JSON.stringify(peaks).length / 1024).toFixed(2)} KB`);
        console.log(`Speedup Factor: ${(duration * 1000 / (end - start)).toFixed(1)}x faster than realtime`);

        // Validation
        if (peaks.length === 0) {
            console.error('FAIL: No peaks generated');
            process.exit(1);
        }

        // Check if peaks look like a sine wave (approx 1.0 amplitude)
        // Since we take max in window, and sine wave hits 1.0 frequently, most peaks should be close to 1.0
        // unless downsampling aligns perfectly with zero crossings (unlikely).
        const avg = peaks.reduce((a,b) => a+b, 0) / peaks.length;
        console.log(`Average Peak Amplitude: ${avg.toFixed(3)}`);

        if (avg < 0.1) {
            console.warn('WARNING: Average amplitude is very low, check generation logic.');
        } else {
             console.log('SUCCESS: Peaks generated correctly.');
        }

        // Cleanup
        if (fs.existsSync(testFile)) fs.unlinkSync(testFile);

    } catch (error) {
        console.error('POC Execution Failed:', error);
        process.exit(1);
    }
}

run();
