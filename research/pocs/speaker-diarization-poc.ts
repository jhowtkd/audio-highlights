// research/pocs/speaker-diarization-poc.ts
async function runDiarization() {
  console.log('Initializing Speaker Diarization POC...');
  console.log('Sending request to Deepgram API with diarize=true...');

  // Simulated response from Deepgram API
  const data = {
    results: {
      channels: [
        {
          alternatives: [
            {
              words: [
                { word: 'Hello', start: 0.1, end: 0.5, speaker: 0 },
                { word: 'world', start: 0.6, end: 1.0, speaker: 0 },
                { word: 'Hi', start: 1.2, end: 1.5, speaker: 1 },
                { word: 'there', start: 1.6, end: 2.0, speaker: 1 }
              ]
            }
          ]
        }
      ]
    }
  };

  console.log('Received diarization result:');

  // Group words by speaker
  let currentSpeaker = data.results.channels[0].alternatives[0].words[0].speaker;
  let currentTranscript = '';

  data.results.channels[0].alternatives[0].words.forEach((wordObj) => {
    if (wordObj.speaker !== currentSpeaker) {
      console.log(`Speaker ${currentSpeaker}: ${currentTranscript.trim()}`);
      currentSpeaker = wordObj.speaker;
      currentTranscript = '';
    }
    currentTranscript += `${wordObj.word} `;
  });
  console.log(`Speaker ${currentSpeaker}: ${currentTranscript.trim()}`);
}

runDiarization().catch(console.error);