
const ffmpegPath = require('ffmpeg-static');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const filename = path.join(__dirname, 'test_silence.wav');
const outputFilename = path.join(__dirname, 'test_silence_removed.wav');

// 1. Generate audio with silence
// 5s tone, 2s silence, 5s tone => total 12s
function generateAudio() {
    return new Promise((resolve, reject) => {
        const args = [
            '-y',
            '-f', 'lavfi', '-i', 'sine=frequency=440:duration=5',
            '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono:d=2',
            '-f', 'lavfi', '-i', 'sine=frequency=440:duration=5',
            '-filter_complex', '[0:a][1:a][2:a]concat=n=3:v=0:a=1[out]',
            '-map', '[out]',
            filename
        ];
        console.log(`Generating audio...`);
        const ffmpeg = spawn(ffmpegPath, args);
        ffmpeg.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Failed to generate audio (code ${code})`));
        });
    });
}

function detectSilence(file) {
    return new Promise((resolve, reject) => {
        const args = [
            '-i', file,
            '-af', 'silencedetect=noise=-30dB:d=1',
            '-f', 'null',
            '-'
        ];
        console.log(`Detecting silence...`);
        const ffmpeg = spawn(ffmpegPath, args);
        let stderr = '';
        ffmpeg.stderr.on('data', (data) => { stderr += data.toString(); });
        ffmpeg.on('close', (code) => {
            const silences = [];
            const lines = stderr.split('\n');
            let currentStart = null;

            lines.forEach(line => {
                const startMatch = line.match(/silence_start: (\d+(\.\d+)?)/);
                if (startMatch) currentStart = parseFloat(startMatch[1]);

                const endMatch = line.match(/silence_end: (\d+(\.\d+)?)/);
                if (endMatch) {
                   const end = parseFloat(endMatch[1]);
                   if (currentStart !== null) {
                       silences.push({ start: currentStart, end: end });
                       currentStart = null;
                   }
                }
            });
            resolve(silences);
        });
    });
}

function removeSilence(inputFile, outputFile, silences) {
    return new Promise((resolve, reject) => {
        // Calculate "keep" segments
        // We need total duration first, or just assume until infinity?
        // Let's assume we can get duration via ffprobe, but for this POC we know it is 12s.
        // Actually, better to just invert silence intervals.

        // Simulating duration retrieval
        const totalDuration = 12.0;

        const keepSegments = [];
        let cursor = 0;

        silences.forEach(s => {
            if (s.start > cursor) {
                keepSegments.push({ start: cursor, end: s.start });
            }
            cursor = s.end;
        });

        if (cursor < totalDuration) {
            keepSegments.push({ start: cursor, end: totalDuration });
        }

        console.log('Keep segments:', keepSegments);

        // Construct complex filter to trim and concat
        // [0:a]atrim=start=0:end=5,asetpts=PTS-STARTPTS[a0];
        // [0:a]atrim=start=7:end=12,asetpts=PTS-STARTPTS[a1];
        // [a0][a1]concat=n=2:v=0:a=1[out]

        let filterComplex = '';
        let inputs = '';

        keepSegments.forEach((seg, i) => {
            filterComplex += `[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}];`;
            inputs += `[a${i}]`;
        });

        filterComplex += `${inputs}concat=n=${keepSegments.length}:v=0:a=1[out]`;

        const args = [
            '-y',
            '-i', inputFile,
            '-filter_complex', filterComplex,
            '-map', '[out]',
            outputFile
        ];

        console.log(`Removing silence...`);
        const ffmpeg = spawn(ffmpegPath, args);

        ffmpeg.stderr.on('data', (d) => { /* console.log(d.toString()) */ });

        ffmpeg.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Failed to remove silence (code ${code})`));
        });
    });
}

async function run() {
    try {
        await generateAudio();
        const silences = await detectSilence(filename);
        console.log('Silences:', silences);

        await removeSilence(filename, outputFilename, silences);
        console.log('Silence removed! Output at', outputFilename);

        // Verify duration of output
        // Should be 10s (5 + 5)

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
