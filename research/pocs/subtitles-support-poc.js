const fs = require('fs');
const { spawn } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const path = require('path');

async function run() {
    console.log('Generating test audio...');
    const srtContent = `1
00:00:00,000 --> 00:00:02,000
Hello World`;
    fs.writeFileSync('test_poc.srt', srtContent);

    console.log('Burning subtitles...');
    const args = [
        '-y',
        '-f', 'lavfi',
        '-i', 'color=c=blue:s=320x240:d=2',
        '-vf', 'subtitles=test_poc.srt',
        'test_poc_output.mp4'
    ];

    const proc = spawn(ffmpeg, args);
    proc.stderr.on('data', d => console.log(d.toString()));

    await new Promise((resolve, reject) => {
        proc.on('close', code => {
            if (code === 0) resolve();
            else reject(new Error('Failed ' + code));
        });
    });
    console.log('Done!');
}
run().catch(console.error);