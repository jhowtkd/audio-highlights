import { useState, useEffect, useCallback, useRef } from 'react';
import type { TranscriptionSegment } from '@/types';

interface SearchResult {
  segmentId: string;
  text: string;
  startTime: number;
  endTime: number;
  relevanceScore: number;
  matchReason: string;
}

export function useSemanticSearch() {
  const [isReady, setIsReady] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [indexProgress, setIndexProgress] = useState(0);
  const [modelProgress, setModelProgress] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);

  // Initialize the worker only once
  useEffect(() => {
    if (!workerRef.current) {
      // Create the worker from the compiled version (Next.js handles this well if we use new Worker(new URL(...)))
      workerRef.current = new Worker(new URL('../lib/search-worker.ts', import.meta.url), {
        type: 'module'
      });

      // Handle messages from the worker
      workerRef.current.addEventListener('message', (event) => {
        const { status, type, progress, results: searchResults, error: workerError, info } = event.data;

        if (status === 'progress') {
          if (type === 'load') {
             if (info?.progress) {
                 setModelProgress(Math.round(info.progress));
             }
          } else if (type === 'index') {
            setIndexProgress(progress);
          }
        } else if (status === 'ready') {
          setIsReady(true);
          setIsModelLoading(false);
        } else if (status === 'indexed') {
          setIsIndexing(false);
          setIndexProgress(100);
        } else if (status === 'results') {
          setResults(searchResults);
          setIsSearching(false);
        } else if (status === 'error') {
          setError(workerError);
          setIsModelLoading(false);
          setIsIndexing(false);
          setIsSearching(false);
        }
      });
    }

    return () => {
      // Cleanup worker on unmount
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const loadModel = useCallback(() => {
    if (workerRef.current && !isReady && !isModelLoading) {
      setIsModelLoading(true);
      setError(null);
      workerRef.current.postMessage({ action: 'load' });
    }
  }, [isReady, isModelLoading]);

  const indexSegments = useCallback((segments: TranscriptionSegment[]) => {
    if (workerRef.current && isReady && segments.length > 0) {
      setIsIndexing(true);
      setIndexProgress(0);
      setError(null);
      workerRef.current.postMessage({
        action: 'index',
        payload: {
          segments: segments.map(s => ({
            id: s.id,
            start: s.start,
            end: s.end,
            text: s.text
          }))
        }
      });
    }
  }, [isReady]);

  const search = useCallback((query: string, maxResults = 10) => {
    if (workerRef.current && isReady && query.trim()) {
      setIsSearching(true);
      setError(null);
      workerRef.current.postMessage({
        action: 'search',
        payload: { query, maxResults }
      });
    }
  }, [isReady]);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    isReady,
    isModelLoading,
    isIndexing,
    isSearching,
    indexProgress,
    modelProgress,
    results,
    error,
    loadModel,
    indexSegments,
    search,
    clearResults
  };
}
