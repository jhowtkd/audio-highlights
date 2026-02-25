const ffmpeg = require('ffmpeg-static');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const audioPath = path.join(__dirname, 'silence_test.mp3');

console.log('Using ffmpeg from:', ffmpeg);

// 1. Generate audio with silence (1s tone, 2s silence, 1s tone)
// lavfi expression: sine=f=440:d=1 [s1]; anullsrc=d=2 [s2]; sine=f=880:d=1 [s3]; [s1][s2][s3]concat=n=3:v=0:a=1[out]
const genArgs = [
    '-y',
    '-f', 'lavfi', '-i', 'sine=f=440:d=1',
    '-f', 'lavfi', '-i', 'anullsrc=d=2',
    '-f', 'lavfi', '-i', 'sine=f=880:d=1',
    '-filter_complex', '[0:a][1:a][2:a]concat=n=3:v=0:a=1[out]',
    '-map', '[out]',
    audioPath
];

console.log('Generating test audio...');
const generator = spawn(ffmpeg, genArgs);

generator.stderr.on('data', (data) => {
    // console.log(`[Gen]: ${data}`);
});

generator.on('close', (code) => {
    if (code !== 0) {
        console.error('Failed to generate audio');
        process.exit(1);
    }
    console.log('Audio generated:', audioPath);

    // 2. Detect silence
    // threshold: -30dB, duration: 0.5s (to catch the 2s block)
    const detectArgs = [
        '-i', audioPath,
        '-af', 'silencedetect=noise=-30dB:d=0.5',
        '-f', 'null', '-'
    ];

    console.log('Running silence detection...');
    const detector = spawn(ffmpeg, detectArgs);
    let log = '';

    detector.stderr.on('data', (data) => {
        log += data.toString();
    });

    detector.on('close', (code) => {
        console.log('Detection complete.');

        // Parse output
        const silences = [];
        let currentStart = null;

        const lines = log.split('\n');
        lines.forEach(line => {
            if (line.includes('silence_start:')) {
                const match = line.match(/silence_start: ([\d.]+)/);
                if (match) {
                    currentStart = parseFloat(match[1]);
                }
            }
            if (line.includes('silence_end:')) {
                const match = line.match(/silence_end: ([\d.]+)/);
                if (match && currentStart !== null) {
                    const end = parseFloat(match[1]);
                    silences.push({ start: currentStart, end });
                    currentStart = null;
                }
            }
        });

        console.log('Detected Silences:', JSON.stringify(silences, null, 2));

        // Verify result: Should detect silence approx 1.0 -> 3.0
        const expectedStart = 1.0;
        const expectedEnd = 3.0;
        const tolerance = 0.1;

        if (silences.length === 1 &&
            Math.abs(silences[0].start - expectedStart) < tolerance &&
            Math.abs(silences[0].end - expectedEnd) < tolerance) {
            console.log('SUCCESS: Detection accurate.');
        } else {
            console.error('FAILURE: Detection inaccurate or unexpected.');
        }

        // Clean up
        fs.unlinkSync(audioPath);
    });
});
