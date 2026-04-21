const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');

const TEST_FILE = 'test_audio_norm.wav';
const OUTPUT_FILE = 'test_audio_norm_out.wav';

// Create a file with quiet and loud parts
function createTestFile() {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-f', 'lavfi', '-i', 'sine=frequency=440:duration=5',
      '-filter_complex', 'volume=0.1',
      TEST_FILE
    ];

    const proc = spawn(ffmpegPath, args);
    let stderr = '';
    proc.stderr.on('data', d => stderr += d.toString());

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.error(stderr);
        reject(new Error('Failed to create test file'));
      }
    });
  });
}

async function run() {
  try {
    await createTestFile();
    console.log('Test file created.');

    // Test loudnorm filter
    await new Promise((resolve, reject) => {
      const args = [
        '-y',
        '-i', TEST_FILE,
        '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
        OUTPUT_FILE
      ];

      const proc = spawn(ffmpegPath, args);
      let stderr = '';
      proc.stderr.on('data', d => stderr += d.toString());

      proc.on('close', (code) => {
        if (code === 0) {
          console.log(stderr); // Should output loudnorm stats
          resolve();
        } else {
          console.error(stderr);
          reject(new Error('Failed to normalize audio'));
        }
      });
    });
    console.log('Normalization applied.');

  } catch (err) {
    console.error(err);
  }
}

run();
