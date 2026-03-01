import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

// Use ffmpeg-static binary
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}

const TEMP_DIR = path.join(process.cwd(), 'temp_poc');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const TEST_FILE = path.join(TEMP_DIR, 'silence_test.mp3');

async function createTestFile() {
    console.log('Generating test file with silence...');
    return new Promise<void>((resolve, reject) => {
        // Generate 3s tone, 2s silence, 3s tone
        // using filter_complex to concatenate sources
        // sine=f=440:d=3 -> 3s tone
        // anullsrc=d=2 -> 2s silence
        const args = [
            '-y',
            '-f', 'lavfi', '-i', 'sine=f=440:d=3',
            '-f', 'lavfi', '-i', 'anullsrc=d=2',
            '-f', 'lavfi', '-i', 'sine=f=880:d=3',
            '-filter_complex', '[0:a][1:a][2:a]concat=n=3:v=0:a=1[out]',
            '-map', '[out]',
            TEST_FILE
        ];

        const proc = spawn(ffmpegStatic!, args);

        proc.stderr.on('data', (d) => {
             // console.log(d.toString()); // Verbose ffmpeg output
        });

        proc.on('close', (code) => {
            if (code === 0) {
                console.log('Test file created:', TEST_FILE);
                resolve();
            } else {
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });
    });
}

async function detectSilence(filePath: string) {
    console.log('Detecting silence...');
    return new Promise<Array<{ start: number, end: number, duration: number }>>((resolve, reject) => {
        const silences: Array<{ start: number, end: number, duration: number }> = [];

        // Use silencedetect filter
        // noise=-30dB means anything below -30dB is considered silence
        // d=0.5 means silence must be at least 0.5 seconds
        const args = [
            '-i', filePath,
            '-af', 'silencedetect=noise=-30dB:d=0.5',
            '-f', 'null',
            '-' // output to null, we just need stderr
        ];

        const proc = spawn(ffmpegStatic!, args);

        let stderr = '';
        proc.stderr.on('data', (d) => {
            stderr += d.toString();
        });

        proc.on('close', (code) => {
            if (code === 0) {
                // Parse stderr for silence_start and silence_end
                // [silencedetect @ 0x...] silence_start: 3.024
                // [silencedetect @ 0x...] silence_end: 5.016 | silence_duration: 1.992

                const lines = stderr.split('\n');
                let currentStart: number | null = null;

                for (const line of lines) {
                    if (line.includes('silence_start:')) {
                        const match = line.match(/silence_start: (\d+(\.\d+)?)/);
                        if (match) {
                            currentStart = parseFloat(match[1]);
                        }
                    } else if (line.includes('silence_end:')) {
                        const matchEnd = line.match(/silence_end: (\d+(\.\d+)?)/);
                        const matchDur = line.match(/silence_duration: (\d+(\.\d+)?)/);

                        if (matchEnd && currentStart !== null) {
                            const end = parseFloat(matchEnd[1]);
                            const duration = matchDur ? parseFloat(matchDur[1]) : (end - currentStart);
                            silences.push({
                                start: currentStart,
                                end: end,
                                duration: duration
                            });
                            currentStart = null;
                        }
                    }
                }

                resolve(silences);
            } else {
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });
    });
}

async function run() {
    try {
        await createTestFile();
        const silences = await detectSilence(TEST_FILE);

        console.log('Detected Silences:', JSON.stringify(silences, null, 2));

        // Expected: One silence around 3s to 5s (duration ~2s)
        const expectedStart = 3.0;
        const expectedDuration = 2.0;
        const tolerance = 0.1;

        const found = silences.find(s =>
            Math.abs(s.start - expectedStart) < tolerance &&
            Math.abs(s.duration - expectedDuration) < tolerance
        );

        if (found) {
            console.log('✅ Success: Silence detected correctly!');
        } else {
            console.error('❌ Failure: Expected silence not found.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        // Cleanup
        if (fs.existsSync(TEST_FILE)) {
            fs.unlinkSync(TEST_FILE);
        }
        if (fs.existsSync(TEMP_DIR)) {
            fs.rmdirSync(TEMP_DIR);
        }
    }
}

run();
