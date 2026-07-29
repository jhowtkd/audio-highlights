import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

// Note: To test this POC, you would need ffmpeg-static installed in devDependencies.
// Since this is a TypeScript POC, it acts as a blueprint for the ffmpeg-service microservice.
// Usage in ffmpeg-service would be similar, utilizing the already existing ffmpeg spawn setup.

export async function burnSubtitles(
  videoPath: string,
  srtPath: string,
  outputPath: string
): Promise<void> {
  // FFmpeg requires absolute paths for the subtitles filter to be properly escaped
  // especially on Windows, but it's good practice everywhere to avoid path parsing issues.
  const escapedSrtPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');

  return new Promise((resolve, reject) => {
    // When burning subtitles, we CANNOT use stream copy (-c copy) for video,
    // because the video frames themselves need to be modified.
    // We must re-encode the video stream. Audio can still be copied.
    const ffmpegArgs = [
      '-y', // Overwrite
      '-i', videoPath, // Input video
      '-vf', `subtitles=${escapedSrtPath}`, // Video filter for subtitles
      '-c:v', 'libx264', // Re-encode video (required for filters)
      '-preset', 'fast', // Balance between speed and compression
      '-c:a', 'copy', // Copy audio stream
      outputPath,
    ];

    console.log(`[FFmpeg] Executing: ffmpeg ${ffmpegArgs.join(' ')}`);

    // In actual implementation, we would use 'ffmpeg-static' or system ffmpeg
    const ffmpeg = spawn('ffmpeg', ffmpegArgs);

    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(err);
    });
  });
}
