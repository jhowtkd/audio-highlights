import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

async function burnSubtitles(videoPath: string, srtPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // We need to escape the path for the subtitles filter
        const escapedSrtPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');

        const ffmpeg = spawn('ffmpeg', [
            '-y',
            '-i', videoPath,
            '-vf', `subtitles=${escapedSrtPath}:force_style='Fontname=Arial,Fontsize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,MarginV=20'`,
            '-c:a', 'copy',
            outputPath
        ]);

        let stderr = '';
        ffmpeg.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`FFmpeg failed with code ${code}\n${stderr}`));
            }
        });
    });
}
console.log("POC script created.");