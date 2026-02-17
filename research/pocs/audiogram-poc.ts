
import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

const OUT_DIR = path.join(process.cwd(), 'research/pocs/output');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const OUTPUT_FILE = path.join(OUT_DIR, 'audiogram_test.mp4');

if (!ffmpegStatic) {
  console.error('ffmpeg-static not found');
  process.exit(1);
}

console.log('Generating simplified audiogram POC...');

// Using sine wave source directly
const args = [
  '-f', 'lavfi',
  '-i', 'sine=frequency=440:duration=5',
  '-filter_complex', '[0:a]showwaves=s=1280x720:mode=line:colors=white[v]',
  '-map', '[v]',
  '-map', '0:a',
  '-c:v', 'libx264',
  '-preset', 'ultrafast',
  '-c:a', 'aac',
  '-y',
  OUTPUT_FILE
];

console.log(`Command: ${ffmpegStatic} ${args.join(' ')}`);

const ffmpeg = spawn(ffmpegStatic, args);

ffmpeg.stdout.on('data', (data) => {
  // console.log(`stdout: ${data}`);
});

ffmpeg.stderr.on('data', (data) => {
   // console.error(`stderr: ${data}`);
});

ffmpeg.on('close', (code) => {
  if (code === 0) {
    console.log(`Success! Audiogram generated at ${OUTPUT_FILE}`);
    const stats = fs.statSync(OUTPUT_FILE);
    console.log(`File size: ${stats.size} bytes`);

    // Cleanup
    try {
        fs.unlinkSync(OUTPUT_FILE);
        console.log('Cleanup successful');
    } catch(e) {}
  } else {
    console.error(`FFmpeg process exited with code ${code}`);
    process.exit(code);
  }
});
