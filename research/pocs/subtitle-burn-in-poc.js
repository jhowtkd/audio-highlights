const { spawn } = require('child_process');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

async function burnSubtitles() {
    console.log('Generating dummy video and subtitles...');

    const videoPath = path.join(__dirname, 'dummy_video.mp4');
    const srtPath = path.join(__dirname, 'dummy_sub.srt');
    const outputPath = path.join(__dirname, 'output_with_subs.mp4');

    fs.writeFileSync(srtPath, `1
00:00:00,000 --> 00:00:02,000
Hello, this is a test highlight!

2
00:00:02,500 --> 00:00:04,500
Burned-in subtitles make videos viral.
`);

    await new Promise((resolve, reject) => {
        const createVideo = spawn(ffmpegStatic, [
            '-f', 'lavfi',
            '-i', 'color=c=blue:s=1280x720:d=5',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-y',
            videoPath
        ]);
        createVideo.on('close', code => code === 0 ? resolve() : reject(new Error('Failed to create video')));
    });

    console.log('Burning subtitles into video...');

    await new Promise((resolve, reject) => {
        const burnProcess = spawn(ffmpegStatic, [
            '-i', 'dummy_video.mp4',
            '-vf', "subtitles=dummy_sub.srt:force_style='FontSize=36,PrimaryColour=&H00FFFF,BorderStyle=1,Outline=2,Shadow=1,MarginV=40'",
            '-c:a', 'copy',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-y',
            'output_with_subs.mp4'
        ], { cwd: __dirname });

        burnProcess.stderr.on('data', d => { /* ignore logs */ });

        burnProcess.on('close', code => {
            if (code === 0) {
                console.log('Successfully created output_with_subs.mp4');
                resolve();
            } else {
                reject(new Error(`Failed with code ${code}`));
            }
        });
    });
}

burnSubtitles().catch(console.error);
