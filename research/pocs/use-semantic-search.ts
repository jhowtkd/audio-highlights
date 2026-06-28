import { useEffect, useState, useCallback, useRef } from 'react';

type SearchSegment = {
  id: string;
  text: string;
};

type SearchResult = {
  segmentId: string;
  score: number;
};

export function useSemanticSearch(segments: SearchSegment[]) {
  const workerRef = useRef<Worker | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [progress, setProgress] = useState<any>(null);
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./transformers-worker.ts', import.meta.url), {
      type: 'module'
    });

    workerRef.current.onmessage = (event) => {
      const { status: msgStatus, ...data } = event.data;

      if (msgStatus === 'progress') {
        setProgress(data.progress);
      } else if (msgStatus === 'indexing') {
        setStatus('indexing');
      } else if (msgStatus === 'ready') {
        setStatus('ready');
      } else if (msgStatus === 'search_result') {
        setResults(data.results);
        setStatus('ready');
      } else if (msgStatus === 'error') {
        setStatus('error');
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const indexSegments = useCallback(() => {
    if (workerRef.current && segments.length > 0) {
      setStatus('loading_model');
      workerRef.current.postMessage({ type: 'INDEX', data: segments });
    }
  }, [segments]);

  const search = useCallback((query: string, maxResults = 5) => {
    if (workerRef.current && query.trim() !== '') {
      setStatus('searching');
      workerRef.current.postMessage({
        type: 'SEARCH',
        data: { query, maxResults }
      });
    } else {
      setResults([]);
    }
  }, []);

  return { status, progress, results, indexSegments, search };
}
