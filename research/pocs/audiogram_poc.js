const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

const audioPath = path.join(__dirname, 'test_audio.mp3');
const videoPath = path.join(__dirname, 'audiogram.mp4');

// Generate dummy audio
const generateAudio = () => {
    return new Promise((resolve, reject) => {
        console.log('Generating dummy audio...');
        const ffmpeg = spawn(ffmpegPath, [
            '-f', 'lavfi',
            '-i', 'sine=frequency=440:duration=3',
            '-c:a', 'libmp3lame',
            '-y',
            audioPath
        ]);

        ffmpeg.on('close', code => {
            if (code === 0) resolve();
            else reject(new Error('Audio generation failed'));
        });
    });
};

// Generate audiogram
const generateAudiogram = () => {
    return new Promise((resolve, reject) => {
        console.log('Generating audiogram...');
        const startTime = Date.now();
        const ffmpeg = spawn(ffmpegPath, [
            '-i', audioPath,
            '-filter_complex', '[0:a]showwaves=s=1280x720:mode=cline:colors=white:rate=25[v]',
            '-map', '[v]',
            '-map', '0:a',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-c:a', 'aac',
            '-y',
            videoPath
        ]);

        let stderr = '';
        ffmpeg.stderr.on('data', data => stderr += data.toString());

        ffmpeg.on('close', code => {
            const time = Date.now() - startTime;
            if (code === 0) {
                console.log(`Audiogram generated in ${time}ms!`);
                resolve(time);
            } else {
                console.error(stderr);
                reject(new Error('Audiogram generation failed'));
            }
        });
    });
};

const run = async () => {
    try {
        await generateAudio();
        const time = await generateAudiogram();

        // Clean up
        fs.unlinkSync(audioPath);
        fs.unlinkSync(videoPath);

        console.log('POC Successful!');
    } catch (e) {
        console.error(e);
    }
};

run();
