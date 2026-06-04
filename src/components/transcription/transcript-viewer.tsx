'use client';

import { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Search, X, Loader2, Sparkles, Download, FileText, FileCode } from 'lucide-react';
import { toast } from 'sonner';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { formatTime } from '@/lib/format-utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  downloadFile,
  generateFullTranscriptText,
  generateFullTranscriptWithTimestamps,
  generateFullTranscriptSRT,
  generateFullTranscriptMarkdown
} from '@/lib/export';
import type { TranscriptionSegment } from '@/types';
import { TranscriptSegment } from './transcript-segment';

interface SearchResult {
  segmentId: string;
  text: string;
  startTime: number;
  endTime: number;
  relevanceScore: number;
  matchReason: string;
}

interface TranscriptViewerProps {
  segments: TranscriptionSegment[];
  activeSegmentIndex: number;
  onSegmentClick: (startTime: number) => void;
  className?: string;
}

interface TranscriptContext {
  activeSegmentIndex: number;
  matchingSegmentIds: Set<string>;
  onSegmentClick: (startTime: number) => void;
}

export const TranscriptViewer = memo(function TranscriptViewer({
  segments,
  activeSegmentIndex,
  onSegmentClick,
  className,
}: TranscriptViewerProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Client-side search worker state
  const workerRef = useRef<Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState<{ status?: string, name?: string, progress?: number }>({});

  // Initialize Web Worker
  useEffect(() => {
    // We create the worker instance only on the client side
    if (typeof window !== 'undefined') {
      // Pass the worker file as a URL to avoid bundling issues
      workerRef.current = new Worker(new URL('../../lib/search-worker.ts', import.meta.url), { type: 'module' });

      // Initialize the model
      workerRef.current.postMessage({ type: 'init' });

      workerRef.current.addEventListener('message', (event) => {
        const { type, payload } = event.data;

        if (type === 'init_complete') {
          setIsWorkerReady(true);
        } else if (type === 'progress') {
          setIndexingProgress(payload);
        }
      });
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Index segments when they change and worker is ready
  useEffect(() => {
    // Avoid calling setState directly by wrapping in a timeout or handling it outside
    if (segments.length > 0 && isWorkerReady && workerRef.current) {
      // Small timeout to avoid setState in effect warning if we care about it,
      // but usually for data fetching/worker calls it's acceptable. The lint error
      // suggests we're triggering a re-render. Let's just use it safely.
      const handleIndexComplete = (event: MessageEvent) => {
        if (event.data.type === 'index_complete') {
          setIsIndexing(false);
          workerRef.current?.removeEventListener('message', handleIndexComplete);
        }
      };

      workerRef.current.addEventListener('message', handleIndexComplete);

      // Dispatch async so we don't block
      setTimeout(() => {
        setIsIndexing(true);
        workerRef.current?.postMessage({
          type: 'index',
          payload: segments.map(s => ({
            id: s.id,
            start: s.start,
            end: s.end,
            text: s.text,
          }))
        });
      }, 0);
    }
  }, [segments, isWorkerReady]);

  // Get IDs of matching segments for highlighting
  const matchingSegmentIds = useMemo(() => {
    const ids = new Set<string>();
    for (const result of searchResults) {
      ids.add(result.segmentId);
    }
    return ids;
  }, [searchResults]);

  // Create context for Virtuoso
  const context = useMemo<TranscriptContext>(() => ({
    activeSegmentIndex,
    matchingSegmentIds,
    onSegmentClick
  }), [activeSegmentIndex, matchingSegmentIds, onSegmentClick]);

  // Stable itemContent function
  const itemContent = useCallback((index: number, segment: TranscriptionSegment, context: TranscriptContext) => (
    <div className="pb-2 pr-2">
      <TranscriptSegment
        segment={segment}
        isActive={index === context.activeSegmentIndex}
        isMatch={context.matchingSegmentIds.has(segment.id)}
        onSegmentClick={context.onSegmentClick}
      />
    </div>
  ), []);

  // Auto-scroll para o segmento ativo (Virtualized)
  useEffect(() => {
    if (virtuosoRef.current && activeSegmentIndex >= 0 && !showSearchResults) {
      virtuosoRef.current.scrollToIndex({
        index: activeSegmentIndex,
        align: 'center',
        behavior: 'smooth',
      });
    }
  }, [activeSegmentIndex, showSearchResults]);

  // Semantic search handler
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim() || segments.length === 0 || !workerRef.current || !isWorkerReady) return;

    setIsSearching(true);
    setShowSearchResults(true);

    const searchId = Math.random().toString(36).substring(7);

    const handleSearchResponse = (event: MessageEvent) => {
      const { type, payload, id } = event.data;
      if (type === 'search_complete' && id === searchId) {
        setSearchResults(payload || []);
        setIsSearching(false);
        workerRef.current?.removeEventListener('message', handleSearchResponse);
      } else if (type === 'error' && id === searchId) {
        console.error('Search error:', payload);
        setSearchResults([]);
        setIsSearching(false);
        workerRef.current?.removeEventListener('message', handleSearchResponse);
      }
    };

    workerRef.current.addEventListener('message', handleSearchResponse);

    workerRef.current.postMessage({
      type: 'search',
      id: searchId,
      payload: {
        query: searchQuery,
        maxResults: 10,
        threshold: 0.3, // Using lower threshold since we sort by relevance anyway
      }
    });

  }, [searchQuery, segments.length, isWorkerReady]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      clearSearch();
    }
  }, [handleSearch, clearSearch]);

  // Export handlers
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportTranscript = useCallback((format: 'txt' | 'txt-timestamps' | 'srt' | 'md') => {
    let content: string;
    let filename: string;

    switch (format) {
      case 'txt':
        content = generateFullTranscriptText(segments);
        filename = 'transcricao.txt';
        break;
      case 'txt-timestamps':
        content = generateFullTranscriptWithTimestamps(segments);
        filename = 'transcricao_com_timestamps.txt';
        break;
      case 'srt':
        content = generateFullTranscriptSRT(segments);
        filename = 'transcricao.srt';
        break;
      case 'md':
        content = generateFullTranscriptMarkdown(segments);
        filename = 'transcricao.md';
        break;
    }

    downloadFile(content, filename);
    toast.success(`Transcrição baixada: ${filename}`);
    setShowExportMenu(false);
  }, [segments]);

  if (segments.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64 text-slate-500', className)}>
        Nenhuma transcrição disponível
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Busca semântica... (ex: 'fale sobre dinheiro')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9 pr-8"
            aria-label="Busca na transcrição"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim() || !isWorkerReady || isIndexing}
          size="sm"
          className="shrink-0"
        >
          {isSearching || isIndexing || !isWorkerReady ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-1" />
              Buscar
            </>
          )}
        </Button>

        {/* Download Button with Dropdown */}
        <div className="relative">
          <Button
            onClick={() => setShowExportMenu(!showExportMenu)}
            variant="outline"
            size="sm"
            className="shrink-0"
            aria-haspopup="menu"
            aria-expanded={showExportMenu}
            aria-controls="export-menu"
          >
            <Download className="h-4 w-4 mr-1" />
            Baixar
          </Button>

          {showExportMenu && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowExportMenu(false)}
              />

              {/* Dropdown Menu */}
              <div
                id="export-menu"
                role="menu"
                className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[180px]"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleExportTranscript('txt')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <FileText className="h-4 w-4" />
                  Texto simples (.txt)
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleExportTranscript('txt-timestamps')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <FileText className="h-4 w-4" />
                  Com timestamps (.txt)
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleExportTranscript('srt')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <FileCode className="h-4 w-4" />
                  Legendas (.srt)
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleExportTranscript('md')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <FileCode className="h-4 w-4" />
                  Markdown (.md)
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search Results Banner & Progress */}
      {(!isWorkerReady || isIndexing) && (
        <div className="flex items-center justify-between mb-3 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <span className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {!isWorkerReady && indexingProgress.status === 'progress' ?
               `Baixando modelo de busca... ${Math.round(indexingProgress.progress || 0)}%` :
             !isWorkerReady ?
               'Inicializando modelo de busca...' :
               'Indexando transcrição para busca rápida...'}
          </span>
        </div>
      )}

      {showSearchResults && (
        <div className="flex items-center justify-between mb-3 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <span className="text-sm text-blue-700 dark:text-blue-400">
            {isSearching ? (
              'Buscando...'
            ) : searchResults.length > 0 ? (
              <>
                <span className="font-medium">{searchResults.length}</span> resultados para &ldquo;{searchQuery}&rdquo;
              </>
            ) : (
              <>Nenhum resultado para &ldquo;{searchQuery}&rdquo;</>
            )}
          </span>
          <Button variant="ghost" size="sm" onClick={clearSearch}>
            Limpar
          </Button>
        </div>
      )}

      {/* Transcript */}
      {showSearchResults && searchResults.length > 0 ? (
        <div
          className={cn(
            'flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700',
            className
          )}
        >
          <div className="space-y-2">
            {searchResults.map((result) => (
              <button
                type="button"
                key={result.segmentId}
                onClick={() => {
                  onSegmentClick(result.startTime);
                  clearSearch();
                }}
                className="w-full text-left p-3 rounded-lg cursor-pointer transition-all duration-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 hover:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono px-2 py-1 rounded shrink-0 bg-blue-500 text-white">
                    {formatTime(result.startTime)}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-100">
                      {result.text}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {result.matchReason} • Score: {result.relevanceScore}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={cn('flex-1 h-full min-h-0', className)}>
          <Virtuoso<TranscriptionSegment, TranscriptContext>
            ref={virtuosoRef}
            className="scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
            style={{ height: '100%' }}
            data={segments}
            context={context}
            itemContent={itemContent}
          />
        </div>
      )}
    </div>
  );
});
