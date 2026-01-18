'use client';

import { useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Dropzone } from '@/components/upload/dropzone';
import { useTaskQueue } from '@/hooks/use-task-queue';

interface UploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
    const { addTask } = useTaskQueue();
    const [isUploading, setIsUploading] = useState(false);

    const handleFileAccepted = useCallback((file: File, duration: number) => {
        setIsUploading(true);

        // Adiciona à fila e fecha o dialog
        addTask(file, duration);

        setIsUploading(false);
        onOpenChange(false);
    }, [addTask, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Adicionar novo áudio</DialogTitle>
                </DialogHeader>

                <div className="mt-4">
                    <Dropzone
                        onFileAccepted={handleFileAccepted}
                        isUploading={isUploading}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
