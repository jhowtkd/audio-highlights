const fs = require('fs');
async function runPoc() {
  console.log("Simulating Deepgram API call for Speaker Diarization...");
  const dummyResponse = {
    results: {
      channels: [
        {
          alternatives: [
            {
              words: [
                { word: "Hello", start: 0.1, end: 0.5, speaker: 0 },
                { word: "World", start: 0.6, end: 1.0, speaker: 1 }
              ]
            }
          ]
        }
      ]
    }
  };
  console.log("Diarization Result:", JSON.stringify(dummyResponse, null, 2));
}
runPoc();