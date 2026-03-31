'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatFileSize, formatDuration } from '@/lib/format-utils';
import { cn } from '@/lib/utils';
import {
  ACCEPTED_AUDIO_TYPES,
  MAX_FILE_SIZE,
  MAX_AUDIO_DURATION,
  ERROR_MESSAGES,
} from '@/lib/constants';

interface AudioFile {
  file: File;
  duration: number;
  url: string;
}

interface DropzoneProps {
  onFileAccepted: (file: File, duration: number) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export function Dropzone({ onFileAccepted, isUploading, uploadProgress = 0 }: DropzoneProps) {
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = 'metadata';

      // Timeout para arquivos que o navegador não consegue ler
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(audio.src);
        // Estimar duração baseado no tamanho (~128kbps para áudio comprimido)
        const estimatedDuration = (file.size * 8) / (128 * 1000);
        console.warn(`Não foi possível ler metadados de ${file.name}, estimando duração: ${estimatedDuration}s`);
        resolve(Math.min(estimatedDuration, MAX_AUDIO_DURATION));
      }, 5000);

      audio.onloadedmetadata = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(audio.src);
        resolve(audio.duration);
      };

      audio.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(audio.src);
        // Fallback: estimar duração baseado no tamanho do arquivo
        const estimatedDuration = (file.size * 8) / (128 * 1000);
        console.warn(`Erro ao ler ${file.name}, estimando duração: ${estimatedDuration}s`);
        resolve(Math.min(estimatedDuration, MAX_AUDIO_DURATION));
      };

      audio.src = URL.createObjectURL(file);
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);

    if (acceptedFiles.length === 0) {
      return;
    }

    const file = acceptedFiles[0];

    if (file.size > MAX_FILE_SIZE) {
      setError(ERROR_MESSAGES.FILE_TOO_LARGE);
      return;
    }

    try {
      const duration = await getAudioDuration(file);

      if (duration > MAX_AUDIO_DURATION) {
        setError(ERROR_MESSAGES.AUDIO_TOO_LONG);
        return;
      }

      const url = URL.createObjectURL(file);
      setAudioFile({ file, duration, url });
    } catch {
      setError(ERROR_MESSAGES.INVALID_AUDIO_FILE);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject, isFocused } = useDropzone({
    onDrop,
    accept: ACCEPTED_AUDIO_TYPES,
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleRemoveFile = () => {
    if (audioFile) {
      URL.revokeObjectURL(audioFile.url);
    }
    setAudioFile(null);
    setError(null);
  };

  const handleSubmit = () => {
    if (audioFile) {
      onFileAccepted(audioFile.file, audioFile.duration);
    }
  };

  if (isUploading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center bg-slate-50 dark:bg-slate-900"
      >
        <Loader2 className="mx-auto h-12 w-12 text-slate-400 animate-spin mb-4" aria-hidden="true" />
        <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
          Enviando áudio...
        </p>
        <Progress value={uploadProgress} className="max-w-xs mx-auto mb-2" />
        <p className="text-sm text-slate-500">{uploadProgress}%</p>
      </div>
    );
  }

  if (audioFile) {
    return (
      <div className="border-2 border-slate-300 dark:border-slate-700 rounded-xl p-6 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-slate-200 dark:bg-slate-800 rounded-lg">
            <FileAudio className="h-8 w-8 text-slate-600 dark:text-slate-400" aria-hidden="true" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
              {audioFile.file.name}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {formatFileSize(audioFile.file.size)} • {formatDuration(audioFile.duration)}
            </p>

            <audio
              src={audioFile.url}
              controls
              className="mt-3 w-full max-w-md"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemoveFile}
            className="text-slate-500 hover:text-slate-700"
            aria-label="Remover arquivo"
            title="Remover arquivo"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        {audioFile.duration < 60 && (
          <div
            role="status"
            className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2"
          >
            <span className="text-amber-600 dark:text-amber-400 mt-0.5">⚠️</span>
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">Áudio curto ({formatDuration(audioFile.duration)})</p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                A IA precisa de mais contexto para encontrar os melhores momentos. Recomendamos arquivos com pelo menos 1 minuto.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSubmit} size="lg" className="w-full sm:w-auto">
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            Iniciar Transcrição
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps({
          role: 'button',
          'aria-label': 'Área de upload de arquivo. Arraste e solte ou clique para selecionar.',
        })}
        className={cn(
          'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 outline-none',
          isFocused ? 'ring-2 ring-ring/50 ring-offset-2 border-slate-400 dark:border-slate-500' : '',
          isDragActive && !isDragReject
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : isDragReject
              ? 'border-red-500 bg-red-50 dark:bg-red-950'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center">
          <div
            className={cn(
              'p-4 rounded-full mb-4',
              isDragActive && !isDragReject
                ? 'bg-blue-100 dark:bg-blue-900'
                : isDragReject
                  ? 'bg-red-100 dark:bg-red-900'
                  : 'bg-slate-200 dark:bg-slate-800'
            )}
          >
            <Upload
              className={cn(
                'h-8 w-8',
                isDragActive && !isDragReject
                  ? 'text-blue-600 dark:text-blue-400'
                  : isDragReject
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-500'
              )}
              aria-hidden="true"
            />
          </div>

          <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
            {isDragActive
              ? isDragReject
                ? 'Formato não suportado'
                : 'Solte o arquivo aqui'
              : 'Arraste seu áudio aqui'}
          </p>

          <p className="text-sm text-slate-500 mb-4">ou clique para selecionar</p>

          <p className="text-xs text-slate-400">
            MP3, WAV, M4A, OGG, OPUS, FLAC, WebM • Até 500MB • Máx 4h
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
