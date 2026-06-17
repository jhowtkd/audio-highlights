import { useState, useEffect, useRef, useCallback } from 'react';
import type { TranscriptionSegment } from '@/types';

interface SearchResult {
    segmentId: string;
    text: string;
    startTime: number;
    endTime: number;
    relevanceScore: number;
    matchReason: string;
}

export function useSemanticSearch(segments: TranscriptionSegment[]) {
    const workerRef = useRef<Worker | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [progress, setProgress] = useState<number>(0);
    const [isIndexing, setIsIndexing] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

    // Use a ref to track which segments we have already sent to the worker
    const indexedSegmentsRef = useRef<string>('');

    useEffect(() => {
        // Initialize Web Worker
        workerRef.current = new Worker(new URL('../workers/semantic-search.worker.ts', import.meta.url), {
            type: 'module'
        });

        const handleMessage = (event: MessageEvent) => {
            const { type, status, progress, results, error } = event.data;

            switch (type) {
                case 'STATUS':
                    setStatus(status);
                    break;
                case 'PROGRESS':
                    // Downloading model progress
                    if (progress?.progress !== undefined) {
                        setProgress(progress.progress);
                    }
                    break;
                case 'READY':
                    setIsReady(true);
                    setStatus('');
                    break;
                case 'INDEX_START':
                    setIsIndexing(true);
                    setProgress(0);
                    break;
                case 'INDEX_PROGRESS':
                    setProgress(progress);
                    break;
                case 'INDEX_COMPLETE':
                    setIsIndexing(false);
                    setStatus('');
                    setProgress(0);
                    break;
                case 'SEARCH_RESULTS':
                    setSearchResults(results);
                    setIsSearching(false);
                    break;
                case 'ERROR':
                    console.error('Semantic Search Error:', error);
                    setIsIndexing(false);
                    setIsSearching(false);
                    setStatus('Erro no buscador');
                    break;
            }
        };

        workerRef.current.addEventListener('message', handleMessage);

        // Start initialization
        workerRef.current.postMessage({ type: 'INIT' });

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    // Effect to trigger indexing when segments change and worker is ready
    useEffect(() => {
        if (!isReady || segments.length === 0) return;

        const segmentIds = segments.map(s => s.id).join(',');
        if (segmentIds !== indexedSegmentsRef.current) {
            indexedSegmentsRef.current = segmentIds;
            workerRef.current?.postMessage({
                type: 'INDEX',
                data: segments.map(s => ({
                    id: s.id,
                    text: s.text,
                    start: s.start,
                    end: s.end
                }))
            });
        }
    }, [isReady, segments]);

    const search = useCallback((query: string, maxResults: number = 10) => {
        if (!workerRef.current || !isReady || isIndexing || !query.trim()) return;

        setIsSearching(true);
        workerRef.current.postMessage({
            type: 'SEARCH',
            data: { query, maxResults }
        });
    }, [isReady, isIndexing]);

    const clearSearch = useCallback(() => {
        setSearchResults([]);
    }, []);

    return {
        isReady,
        isIndexing,
        isSearching,
        status,
        progress,
        searchResults,
        search,
        clearSearch
    };
}
