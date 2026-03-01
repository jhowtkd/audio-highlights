import ffmpegStatic from 'ffmpeg-static';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ffmpegPath = ffmpegStatic;

if (!ffmpegPath) {
  console.error('ffmpeg-static not found');
  process.exit(1);
}

const workDir = path.join(process.cwd(), 'research', 'pocs', 'temp_silence_removal');
if (!fs.existsSync(workDir)) {
  fs.mkdirSync(workDir, { recursive: true });
}

const inputFile = path.join(workDir, 'input.mp3');
const outputFile = path.join(workDir, 'output.mp3');

async function generateTestAudio() {
  console.log('Generating test audio...');
  // 5s sine, 2s silence, 5s sine
  const args = [
    '-y',
    '-f', 'lavfi',
    '-i', 'sine=f=440:d=5',
    '-f', 'lavfi',
    '-i', 'anullsrc=d=2', // Silence
    '-f', 'lavfi',
    '-i', 'sine=f=880:d=5',
    '-filter_complex', '[0:a][1:a][2:a]concat=n=3:v=0:a=1[out]',
    '-map', '[out]',
    inputFile
  ];

  return new Promise<void>((resolve, reject) => {
    const proc = spawn(ffmpegPath!, args);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Failed to generate audio, code ${code}`));
    });
    proc.stderr.on('data', (d) => console.log('Gen:', d.toString()));
  });
}

async function detectSilence(filePath: string): Promise<Array<{ start: number, end: number }>> {
  console.log('Detecting silence...');
  // silencedetect=noise=-30dB:d=0.5
  const args = [
    '-i', filePath,
    '-af', 'silencedetect=noise=-30dB:d=0.5',
    '-f', 'null',
    '-'
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath!, args);
    let stderr = '';
    proc.stderr.on('data', (d) => stderr += d.toString());

    proc.on('close', (code) => {
      // ffmpeg returns 0 even if it detects silence
      const silences: Array<{ start: number, end: number }> = [];
      const lines = stderr.split('\n');
      let currentStart: number | null = null;

      for (const line of lines) {
        if (line.includes('silence_start:')) {
            const match = line.match(/silence_start: (\d+(\.\d+)?)/);
            if (match) currentStart = parseFloat(match[1]);
        } else if (line.includes('silence_end:')) {
             const match = line.match(/silence_end: (\d+(\.\d+)?)/);
             if (match && currentStart !== null) {
                 silences.push({ start: currentStart, end: parseFloat(match[1]) });
                 currentStart = null;
             }
        }
      }
      resolve(silences);
    });
  });
}

async function removeSilence(filePath: string, silences: Array<{ start: number, end: number }>, totalDuration: number) {
    console.log('Removing silence...');

    // Invert silences to get "keep" segments
    const keepSegments: Array<{ start: number, end: number }> = [];
    let currentPos = 0;

    for (const silence of silences) {
        if (silence.start > currentPos) {
            keepSegments.push({ start: currentPos, end: silence.start });
        }
        currentPos = silence.end;
    }
    if (currentPos < totalDuration) {
        keepSegments.push({ start: currentPos, end: totalDuration });
    }

    console.log('Keep segments:', keepSegments);

    // Construct complex filter to trim and concat
    // [0:a]atrim=start=0:end=5,asetpts=PTS-STARTPTS[a0];
    // [0:a]atrim=start=7:end=12,asetpts=PTS-STARTPTS[a1];
    // [a0][a1]concat=n=2:v=0:a=1[out]

    const filterComplexParts: string[] = [];
    const inputLabels: string[] = [];

    keepSegments.forEach((seg, index) => {
        filterComplexParts.push(`[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${index}]`);
        inputLabels.push(`[a${index}]`);
    });

    filterComplexParts.push(`${inputLabels.join('')}concat=n=${keepSegments.length}:v=0:a=1[out]`);

    const args = [
        '-y',
        '-i', filePath,
        '-filter_complex', filterComplexParts.join(';'),
        '-map', '[out]',
        outputFile
    ];

    return new Promise<void>((resolve, reject) => {
        const proc = spawn(ffmpegPath!, args);
        proc.stderr.on('data', (d) => console.log('Rem:', d.toString()));
        proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Failed to remove silence, code ${code}`));
        });
    });
}

async function run() {
    try {
        await generateTestAudio();
        // We know duration is roughly 12s
        const duration = 12;
        const silences = await detectSilence(inputFile);
        console.log('Detected silences:', silences);

        await removeSilence(inputFile, silences, duration);
        console.log('Done! Output at:', outputFile);

        // Verify duration
         const probeArgs = ['-i', outputFile, '-f', 'null', '-'];
         const proc = spawn(ffmpegPath!, probeArgs);
         let stderr = '';
         proc.stderr.on('data', d => stderr += d.toString());
         proc.on('close', () => {
             const match = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d+)/);
             if (match) {
                 console.log('Final Duration:', match[0]);
             }
         });

    } catch (e) {
        console.error(e);
    }
}

run();
