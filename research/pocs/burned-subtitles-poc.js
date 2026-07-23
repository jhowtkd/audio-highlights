const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function burnSubtitles(videoPath, srtPath, outputPath) {
    // Escape the SRT path for FFmpeg subtitles filter
    const escapedSrtPath = path.resolve(srtPath).replace(/\\/g, '/').replace(/:/g, '\\:');

    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-y',
            '-i', videoPath,
            '-vf', `subtitles='${escapedSrtPath}'`,
            '-c:a', 'copy',
            outputPath
        ]);

        let stderr = '';
        ffmpeg.stderr.on('data', data => stderr += data.toString());

        ffmpeg.on('close', code => {
            if (code === 0) resolve();
            else reject(new Error(stderr));
        });
    });
}
