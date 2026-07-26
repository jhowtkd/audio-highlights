const { spawn } = require('child_process');
const path = require('path');

async function burnSubtitles(inputVideo, inputSrt, outputVideo) {
    // The absolute path to the subtitle file must be escaped to prevent path parsing errors
    const absoluteSrtPath = path.resolve(inputSrt).replace(/\\/g, '/').replace(/:/g, '\\:');

    const ffmpegArgs = [
        '-y',
        '-i', inputVideo,
        '-vf', `subtitles=${absoluteSrtPath}`,
        '-c:a', 'copy',
        outputVideo
    ];

    console.log('Executing FFmpeg with args:', ffmpegArgs);

    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', ffmpegArgs);

        let stderr = '';
        ffmpeg.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                console.log('Subtitles burned successfully!');
                resolve(outputVideo);
            } else {
                console.error('FFmpeg failed:', stderr);
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });
    });
}

module.exports = { burnSubtitles };