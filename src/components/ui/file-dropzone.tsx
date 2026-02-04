import * as React from "react";
import { cn } from "@/lib/utils";
import { Upload, X, FileText, Image, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "./button";
import { Progress } from "./progress";

export interface FileWithPreview extends File {
  preview?: string;
  id: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

interface FileDropzoneProps {
  onFilesSelected: (files: FileWithPreview[]) => void;
  onFileRemove?: (fileId: string) => void;
  files: FileWithPreview[];
  accept?: string;
  maxSize?: number; // en MB
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getFileIcon = (type: string): React.ReactNode => {
  if (type.startsWith('image/')) return <Image className="h-8 w-8 text-primary" />;
  return <FileText className="h-8 w-8 text-muted-foreground" />;
};

export const FileDropzone = ({
  onFilesSelected,
  onFileRemove,
  files,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  maxSize = 10, // 10 MB par défaut
  maxFiles = 5,
  disabled = false,
  className,
}: FileDropzoneProps) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Vérifier la taille
    if (file.size > maxSize * 1024 * 1024) {
      return `Le fichier dépasse la taille maximale de ${maxSize} MB`;
    }

    // Vérifier le type
    const acceptedTypes = accept.split(',').map(t => t.trim().toLowerCase());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const fileMimeType = file.type.toLowerCase();

    const isAccepted = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileExtension === type;
      }
      if (type.includes('/*')) {
        return fileMimeType.startsWith(type.replace('/*', ''));
      }
      return fileMimeType === type;
    });

    if (!isAccepted) {
      return `Type de fichier non accepté. Types autorisés: ${accept}`;
    }

    return null;
  };

  const processFiles = (fileList: FileList | File[]) => {
    setError(null);
    const filesArray = Array.from(fileList);

    // Vérifier le nombre maximum
    if (files.length + filesArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} fichiers autorisés`);
      return;
    }

    const validFiles: FileWithPreview[] = [];

    for (const file of filesArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      const fileWithPreview: FileWithPreview = Object.assign(file, {
        id: crypto.randomUUID(),
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        uploadProgress: 0,
        uploadStatus: 'pending' as const,
      });

      validFiles.push(fileWithPreview);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input pour permettre de sélectionner le même fichier
    e.target.value = '';
  };

  const handleRemoveFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    onFileRemove?.(fileId);
  };

  React.useEffect(() => {
    // Cleanup previews on unmount
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Zone de drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-destructive/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "p-4 rounded-full transition-colors",
            isDragging ? "bg-primary/10" : "bg-muted"
          )}>
            <Upload className={cn(
              "h-8 w-8 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
          </div>

          <div>
            <p className="font-medium text-foreground">
              {isDragging ? "Déposez vos fichiers ici" : "Glissez-déposez vos fichiers"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              ou <span className="text-primary font-medium">cliquez pour parcourir</span>
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            {accept.split(',').join(', ')} • Max {maxSize} MB • {maxFiles} fichiers max
          </p>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {files.length} fichier{files.length > 1 ? 's' : ''} sélectionné{files.length > 1 ? 's' : ''}
          </p>
          
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50"
              >
                {/* Prévisualisation ou icône */}
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="h-12 w-12 object-cover rounded-lg"
                  />
                ) : (
                  <div className="h-12 w-12 flex items-center justify-center bg-muted rounded-lg">
                    {getFileIcon(file.type)}
                  </div>
                )}

                {/* Infos fichier */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>

                  {/* Barre de progression */}
                  {file.uploadStatus === 'uploading' && (
                    <Progress value={file.uploadProgress} className="h-1.5 mt-2" />
                  )}
                </div>

                {/* Statut */}
                <div className="flex items-center gap-2">
                  {file.uploadStatus === 'success' && (
                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  )}
                  {file.uploadStatus === 'error' && (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  
                  {/* Bouton supprimer */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(file.id);
                    }}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
