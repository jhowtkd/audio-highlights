import React, { useState, useEffect, useRef } from 'react';
// import { useHotkeys } from 'react-hotkeys-hook';

// Functional Mock for POC (simulating library behavior using native events)
// In production, this would be replaced by the actual 'react-hotkeys-hook'
const useHotkeys = (keyCombo: string, callback: (e: KeyboardEvent) => void, deps: any[] = []) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Very basic parsing for POC purposes
      const keys = keyCombo.toLowerCase().split('+');
      const mainKey = keys[keys.length - 1];
      const needsShift = keys.includes('shift');

      let pressedKey = e.key.toLowerCase();
      // Handle special keys mapping
      if (pressedKey === ' ') pressedKey = 'space';
      if (pressedKey === 'arrowleft') pressedKey = 'left';
      if (pressedKey === 'arrowright') pressedKey = 'right';

      if (pressedKey === mainKey) {
        if (needsShift && !e.shiftKey) return;
        if (!needsShift && e.shiftKey) return; // Strict matching for POC

        callback(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyCombo, callback, ...deps]);
};

export const KeyboardShortcutsPOC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [feedback, setFeedback] = useState('Press Space to Toggle Play');
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Playback Control
  useHotkeys('space', (e) => {
    // Don't trigger if typing in input
    if (document.activeElement?.tagName === 'INPUT') return;

    e.preventDefault(); // Prevent scrolling
    setIsPlaying(prev => {
        const next = !prev;
        setFeedback(next ? 'Playing' : 'Paused');
        return next;
    });
  });

  // 2. Seeking
  useHotkeys('left', (e) => {
    if (document.activeElement?.tagName === 'INPUT') return;
    setCurrentTime(t => Math.max(0, t - 5));
    setFeedback('Seek -5s');
  });

  useHotkeys('right', (e) => {
    if (document.activeElement?.tagName === 'INPUT') return;
    setCurrentTime(t => t + 5);
    setFeedback('Seek +5s');
  });

  useHotkeys('shift+left', (e) => {
    if (document.activeElement?.tagName === 'INPUT') return;
    setCurrentTime(t => Math.max(0, t - 15));
    setFeedback('Seek -15s (Large)');
  });

  useHotkeys('shift+right', (e) => {
    if (document.activeElement?.tagName === 'INPUT') return;
    setCurrentTime(t => t + 15);
    setFeedback('Seek +15s (Large)');
  });

  // 3. Actions
  useHotkeys('m', (e) => {
    if (document.activeElement?.tagName === 'INPUT') return;
    setFeedback(`Marker created at ${currentTime}s`);
  });

  useHotkeys('/', (e) => {
    e.preventDefault();
    inputRef.current?.focus();
    setFeedback('Focus Search');
  });

  useHotkeys('escape', () => {
    inputRef.current?.blur();
    setFeedback('Cleared Focus');
  });

  return (
    <div className="p-4 border rounded-lg max-w-md mx-auto mt-10 font-sans">
      <h2 className="text-xl font-bold mb-4">Keyboard Shortcuts POC</h2>

      <div className="mb-6 p-6 bg-slate-100 dark:bg-slate-800 rounded-xl text-center border shadow-sm">
        <div className="text-5xl mb-4">{isPlaying ? '▶️' : '⏸️'}</div>
        <div className="text-3xl font-mono text-slate-700 dark:text-slate-200">{currentTime}s</div>
      </div>

      <div className="p-3 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 rounded-lg mb-6 border border-blue-100 dark:border-blue-800">
        Last Action: <strong className="ml-2">{feedback}</strong>
      </div>

      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mb-6">
        <div className="flex items-center justify-between">
          <span>Toggle Play/Pause</span>
          <kbd className="bg-white dark:bg-slate-700 border px-2 py-0.5 rounded shadow-sm text-xs font-mono">Space</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>Seek 5s</span>
          <div>
            <kbd className="bg-white dark:bg-slate-700 border px-2 py-0.5 rounded shadow-sm text-xs font-mono">←</kbd>
            <span className="mx-1">/</span>
            <kbd className="bg-white dark:bg-slate-700 border px-2 py-0.5 rounded shadow-sm text-xs font-mono">→</kbd>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span>Seek 15s</span>
          <div>
            <kbd className="bg-white dark:bg-slate-700 border px-2 py-0.5 rounded shadow-sm text-xs font-mono">Shift</kbd>
            <span className="mx-1">+</span>
            <kbd className="bg-white dark:bg-slate-700 border px-2 py-0.5 rounded shadow-sm text-xs font-mono">←</kbd>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span>Add Marker</span>
          <kbd className="bg-white dark:bg-slate-700 border px-2 py-0.5 rounded shadow-sm text-xs font-mono">M</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>Focus Search</span>
          <kbd className="bg-white dark:bg-slate-700 border px-2 py-0.5 rounded shadow-sm text-xs font-mono">/</kbd>
        </div>
      </div>

      <div className="mt-4">
        <input
            ref={inputRef}
            type="search"
            placeholder="Press '/' to focus..."
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-900 dark:border-slate-700"
        />
        <p className="text-xs text-slate-400 mt-2">
            Try typing here - shortcuts (except Esc) are disabled while typing.
        </p>
      </div>
    </div>
  );
};
