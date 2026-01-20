'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Search, X, Loader2, Sparkles, Download, FileText, FileCode } from 'lucide-react';
import { toast } from 'sonner';
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
  currentTime: number;
  onSegmentClick: (startTime: number) => void;
  className?: string;
}

// Binary search to find the active segment index efficiently
function findActiveSegmentIndex(segments: TranscriptionSegment[], currentTime: number): number {
  let low = 0;
  let high = segments.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const segment = segments[mid];

    if (currentTime >= segment.start && currentTime < segment.end) {
      return mid;
    } else if (currentTime < segment.start) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return -1;
}

export function TranscriptViewer({
  segments,
  currentTime,
  onSegmentClick,
  className,
}: TranscriptViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Cache the last active index to optimize for sequential playback
  const lastActiveIndexRef = useRef<number>(-1);

  // Encontra o segmento ativo baseado no tempo atual
  // Optimized: Use caching for O(1) sequential access, fallback to binary search O(log N)
  const activeSegmentIndex = useMemo(() => {
    const lastIndex = lastActiveIndexRef.current;

    // Check if the last known segment is still active
    if (lastIndex !== -1 && lastIndex < segments.length) {
      const segment = segments[lastIndex];
      if (currentTime >= segment.start && currentTime < segment.end) {
        return lastIndex;
      }

      // Check the next segment (common case during playback)
      const nextIndex = lastIndex + 1;
      if (nextIndex < segments.length) {
        const nextSegment = segments[nextIndex];
        if (currentTime >= nextSegment.start && currentTime < nextSegment.end) {
          lastActiveIndexRef.current = nextIndex;
          return nextIndex;
        }
      }
    }

    // Fallback to binary search
    const index = findActiveSegmentIndex(segments, currentTime);
    lastActiveIndexRef.current = index;
    return index;
  }, [segments, currentTime]);

  // Get IDs of matching segments for highlighting
  const matchingSegmentIds = useMemo(() => {
    const ids = new Set<string>();
    for (const result of searchResults) {
      ids.add(result.segmentId);
    }
    return ids;
  }, [searchResults]);

  // Auto-scroll para o segmento ativo
  useEffect(() => {
    if (activeSegmentRef.current && containerRef.current && !showSearchResults) {
      const container = containerRef.current;
      const activeElement = activeSegmentRef.current;

      const containerRect = container.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();

      const isVisible =
        activeRect.top >= containerRect.top &&
        activeRect.bottom <= containerRect.bottom;

      if (!isVisible) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [activeSegmentIndex, showSearchResults]);

  // Semantic search handler
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || segments.length === 0) return;

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          segments: segments.map(s => ({
            id: s.id,
            start: s.start,
            end: s.end,
            text: s.text,
          })),
          maxResults: 10,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, segments]);

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
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          size="sm"
          className="shrink-0"
        >
          {isSearching ? (
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
              <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[180px]">
                <button
                  type="button"
                  onClick={() => handleExportTranscript('txt')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <FileText className="h-4 w-4" />
                  Texto simples (.txt)
                </button>
                <button
                  type="button"
                  onClick={() => handleExportTranscript('txt-timestamps')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <FileText className="h-4 w-4" />
                  Com timestamps (.txt)
                </button>
                <button
                  type="button"
                  onClick={() => handleExportTranscript('srt')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <FileCode className="h-4 w-4" />
                  Legendas (.srt)
                </button>
                <button
                  type="button"
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

      {/* Search Results Banner */}
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
      <div
        ref={containerRef}
        className={cn(
          'flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700',
          className
        )}
      >
        {/* If showing search results, display them first */}
        {showSearchResults && searchResults.length > 0 ? (
          <div className="space-y-2">
            {searchResults.map((result) => (
              <div
                key={result.segmentId}
                onClick={() => {
                  onSegmentClick(result.startTime);
                  clearSearch();
                }}
                className="p-3 rounded-lg cursor-pointer transition-all duration-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 hover:border-blue-400"
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
              </div>
            ))}
          </div>
        ) : (
          // Regular transcript view
          segments.map((segment, index) => {
            const isActive = index === activeSegmentIndex;
            const isMatch = matchingSegmentIds.has(segment.id);

            return (
              <TranscriptSegment
                key={segment.id}
                ref={isActive ? activeSegmentRef : null}
                segment={segment}
                isActive={isActive}
                isMatch={isMatch}
                onSegmentClick={onSegmentClick}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
