// research/pocs/fuse-search-poc.ts
import Fuse from 'fuse.js';

interface TranscriptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
}

function generateMockData(numSegments: number): TranscriptionSegment[] {
  const segments: TranscriptionSegment[] = [];
  for (let i = 0; i < numSegments; i++) {
    segments.push({
      id: `seg-${i}`,
      start: i * 5,
      end: (i + 1) * 5,
      text: `Este é um segmento de texto simulado número ${i}. Ele contém algumas palavras aleatórias para testar a busca difusa. Talvez inclua tecnologia, inovação ou inteligência artificial.`,
    });
  }
  // Inject some specific searchable content
  segments[Math.floor(numSegments / 4)].text += ' Procure por esta palavra rara: paralelepípedo';
  segments[Math.floor(numSegments / 2)].text += ' Algo sobre aprendizado de máquina e machine learning';
  return segments;
}

async function runBenchmark() {
  console.log('--- Fuse.js Client-Side Search POC ---');

  const numSegments = 5000; // Simulate roughly a 4-7 hour podcast
  console.log(`Generating ${numSegments} mock segments...`);
  const segments = generateMockData(numSegments);

  const options = {
    includeScore: true,
    keys: ['text'],
    threshold: 0.3, // 0.0 requires perfect match, 1.0 matches anything
    ignoreLocation: true, // Don't restrict by where the match occurs in the string
  };

  console.log('\nMeasuring indexing performance...');
  const indexStartTime = performance.now();
  const fuse = new Fuse(segments, options);
  const indexEndTime = performance.now();
  console.log(`Indexing took: ${(indexEndTime - indexStartTime).toFixed(2)}ms`);

  const queries = ['inteligência artificial', 'paralelepípedo', 'machine learning', 'texto simulado'];

  console.log('\nMeasuring search performance...');
  for (const query of queries) {
    const searchStartTime = performance.now();
    const results = fuse.search(query);
    const searchEndTime = performance.now();

    console.log(`Query: "${query}"`);
    console.log(`Found: ${results.length} results`);
    console.log(`Search took: ${(searchEndTime - searchStartTime).toFixed(2)}ms`);
    if (results.length > 0) {
        console.log(`Top match score: ${results[0].score?.toFixed(4)} (ID: ${results[0].item.id})`);
    }
    console.log('---');
  }

  // Memory usage
  const memoryUsage = process.memoryUsage();
  console.log('\nMemory usage:');
  console.log(`RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`);
  console.log(`Heap Total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`);
  console.log(`Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`);
}

runBenchmark().catch(console.error);
