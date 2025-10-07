'use client';

/**
 * File Upload Zone Component
 *
 * Drag-and-drop file upload with:
 * - Visual drop zone overlay
 * - Multiple file support
 * - File type validation
 * - Upload progress tracking
 * - File size limits
 */

import { useState, useCallback, DragEvent } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface FileUploadZoneProps {
  workspaceId: string;
  clientId: string;
  targetPath?: string;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  onUploadComplete?: (files: string[]) => void;
}

export function FileUploadZone({
  workspaceId,
  clientId,
  targetPath = '/',
  maxFileSize = 50, // 50MB default
  allowedTypes,
  onUploadComplete
}: FileUploadZoneProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setIsOpen(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set dragging to false if we're leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = (file: File): string | null => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file type
    if (allowedTypes && allowedTypes.length > 0) {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !allowedTypes.includes(fileExt)) {
        return `File type .${fileExt} is not allowed`;
      }
    }

    return null;
  };

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      await handleFiles(droppedFiles);
    },
    [workspaceId, clientId, targetPath]
  );

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      await handleFiles(selectedFiles);
    }
  };

  const handleFiles = async (files: File[]) => {
    const newUploads: FileUpload[] = files.map((file) => ({
      id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      progress: 0,
      status: 'pending' as const
    }));

    // Validate files
    newUploads.forEach((upload) => {
      const error = validateFile(upload.file);
      if (error) {
        upload.status = 'error';
        upload.error = error;
      }
    });

    setUploads((prev) => [...prev, ...newUploads]);

    // Upload valid files
    const validUploads = newUploads.filter((u) => u.status === 'pending');
    const uploadedPaths: string[] = [];

    for (const upload of validUploads) {
      try {
        await uploadFile(upload, uploadedPaths);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    // Notify completion
    if (uploadedPaths.length > 0 && onUploadComplete) {
      onUploadComplete(uploadedPaths);
    }
  };

  const uploadFile = async (upload: FileUpload, uploadedPaths: string[]) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === upload.id ? { ...u, status: 'uploading' as const } : u))
    );

    try {
      const formData = new FormData();
      formData.append('file', upload.file);
      formData.append('workspaceId', workspaceId);
      formData.append('clientId', clientId);
      formData.append('targetPath', targetPath);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploads((prev) =>
            prev.map((u) => (u.id === upload.id ? { ...u, progress } : u))
          );
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);

          if (response.success) {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === upload.id
                  ? { ...u, status: 'completed' as const, progress: 100 }
                  : u
              )
            );

            uploadedPaths.push(response.path);

            toast({
              title: 'File uploaded',
              description: `${upload.file.name} uploaded successfully`
            });
          } else {
            throw new Error(response.error || 'Upload failed');
          }
        } else {
          throw new Error(`Upload failed with status ${xhr.status}`);
        }
      });

      // Handle error
      xhr.addEventListener('error', () => {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? { ...u, status: 'error' as const, error: 'Network error' }
              : u
          )
        );

        toast({
          title: 'Upload failed',
          description: `Failed to upload ${upload.file.name}`,
          variant: 'destructive'
        });
      });

      xhr.open('POST', '/api/terminal/upload');
      xhr.send(formData);
    } catch (error: any) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === upload.id
            ? { ...u, status: 'error' as const, error: error.message }
            : u
        )
      );

      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleRemoveUpload = (uploadId: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== uploadId));
  };

  const handleClearCompleted = () => {
    setUploads((prev) => prev.filter((u) => u.status !== 'completed'));
  };

  const getStatusIcon = (upload: FileUpload) => {
    switch (upload.status) {
      case 'pending':
        return <File className="h-4 w-4 text-muted-foreground" />;
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      {/* Drop Zone Overlay */}
      {isDragging && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="border-4 border-dashed border-primary rounded-lg p-12 bg-background/50">
            <Upload className="h-16 w-16 mx-auto mb-4 text-primary" />
            <p className="text-2xl font-semibold text-center">Drop files here</p>
            <p className="text-muted-foreground text-center mt-2">
              Upload to {targetPath === '/' ? 'workspace root' : targetPath}
            </p>
          </div>
        </div>
      )}

      {/* Upload List Panel */}
      {isOpen && uploads.length > 0 && (
        <div className="fixed bottom-4 right-4 w-96 bg-background border rounded-lg shadow-lg z-40">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="font-semibold text-sm">File Uploads</span>
              <span className="text-xs text-muted-foreground">
                ({uploads.filter((u) => u.status === 'completed').length}/{uploads.length})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCompleted}
                disabled={!uploads.some((u) => u.status === 'completed')}
              >
                Clear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="h-64">
            <div className="p-2 space-y-2">
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-start gap-2 p-2 border rounded-md"
                >
                  {getStatusIcon(upload)}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{upload.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(upload.file.size)}
                    </p>

                    {upload.status === 'uploading' && (
                      <Progress value={upload.progress} className="mt-2 h-1" />
                    )}

                    {upload.status === 'error' && upload.error && (
                      <p className="text-xs text-red-500 mt-1">{upload.error}</p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleRemoveUpload(upload.id)}
                    disabled={upload.status === 'uploading'}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 border-t">
            <label>
              <input
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
              <Button variant="outline" size="sm" className="w-full" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </span>
              </Button>
            </label>
          </div>
        </div>
      )}

      {/* Hidden drop zone that listens for drag events */}
      <div
        className="fixed inset-0 pointer-events-none"
        onDragEnter={handleDragEnter}
      />
    </>
  );
}
