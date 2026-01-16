'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatFileSize, formatDuration } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

const ACCEPTED_AUDIO_TYPES = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-m4a': ['.m4a'],
  'audio/mp4': ['.m4a'],
  'audio/ogg': ['.ogg'],
  'audio/webm': ['.webm'],
};

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

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
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = 'metadata';

      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(audio.src);
        resolve(audio.duration);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audio.src);
        reject(new Error('Não foi possível ler o arquivo de áudio'));
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
      setError(`Arquivo muito grande. Máximo permitido: ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    try {
      const duration = await getAudioDuration(file);

      if (duration > 4 * 60 * 60) {
        setError('Áudio muito longo. Máximo permitido: 4 horas');
        return;
      }

      const url = URL.createObjectURL(file);
      setAudioFile({ file, duration, url });
    } catch {
      setError('Não foi possível processar o arquivo de áudio');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
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
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="mx-auto h-12 w-12 text-slate-400 animate-spin mb-4" />
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
            <FileAudio className="h-8 w-8 text-slate-600 dark:text-slate-400" />
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
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSubmit} size="lg">
            <Upload className="mr-2 h-4 w-4" />
            Iniciar Transcrição
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200',
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
            MP3, WAV, M4A, OGG, WebM • Até 500MB • Máximo 4 horas
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
