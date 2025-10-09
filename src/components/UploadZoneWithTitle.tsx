import { useState, useCallback } from "react";
import { Upload, X, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface UploadZoneWithTitleProps {
  onUpload: (files: File[], title: string) => Promise<void>;
  onTitleOnly: (title: string) => Promise<void>;
  onCancel: () => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 10MB

const UploadZoneWithTitle = ({ onUpload, onTitleOnly, onCancel }: UploadZoneWithTitleProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const validateFiles = (files: File[]): File[] => {
    const validFiles: File[] = [];

    for (const file of files) {
      if (file.type !== "application/pdf") {
        toast.error(`${file.name} is not a PDF file`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = validateFiles(files);
    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const validFiles = validateFiles(files);
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadWithFiles = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file or use 'Create Title Only'");
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(selectedFiles, title.trim());
      setSelectedFiles([]);
      setTitle("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTitleOnly = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsUploading(true);
    try {
      await onTitleOnly(title.trim());
      setTitle("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="p-6">
      {/* Title Input Section */}
      <div className="mb-6">
        <Label htmlFor="entry-title" className="text-base font-semibold">
          Entry Title *
        </Label>
        <Input
          id="entry-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for this entry..."
          className="mt-2"
          disabled={isUploading}
        />
        <p className="text-xs text-muted-foreground mt-1">
          You can create a title-only entry or add files to it
        </p>
      </div>

      <Separator className="my-6" />

      {/* File Upload Section */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Upload PDF Files (Optional)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drag and drop PDF files here, or click to browse
        </p>
        <input
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          disabled={isUploading}
        />
        <label htmlFor="file-upload">
          <Button type="button" variant="outline" asChild disabled={isUploading}>
            <span>Browse Files</span>
          </Button>
        </label>
        <p className="text-xs text-muted-foreground mt-4">
          Maximum file size: 50MB per file and max of 30 files per upload
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-6">
        {selectedFiles.length > 0 ? (
          <Button
            onClick={handleUploadWithFiles}
            disabled={isUploading || !title.trim()}
            className="flex-1"
          >
            {isUploading ? "Uploading..." : `Upload "${title}" with ${selectedFiles.length} file(s)`}
          </Button>
        ) : (
          <Button
            onClick={handleTitleOnly}
            disabled={isUploading || !title.trim()}
            className="flex-1"
            variant="default"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isUploading ? "Creating..." : "Create Title Only"}
          </Button>
        )}

        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isUploading}
        >
          Cancel
        </Button>
      </div>

      {selectedFiles.length > 0 && title.trim() && (
        <div className="mt-2">
          <Button
            onClick={handleTitleOnly}
            disabled={isUploading}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Or create "{title}" as title-only entry
          </Button>
        </div>
      )}
    </Card>
  );
};

export default UploadZoneWithTitle;