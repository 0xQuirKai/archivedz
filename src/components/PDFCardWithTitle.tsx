import { FileText, Download, Trash2, FileX, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type PDF, pdfAPI } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PDFCardWithTitleProps {
  pdf: PDF;
  onDelete: (pdfId: string) => void;
  onShow?: (pdf: PDF) => void;
}

const PDFCardWithTitle = ({ pdf, onDelete, onShow }: PDFCardWithTitleProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleDownload = () => {
    if (pdf.path) {
      const url = pdfAPI.getDownloadUrl(pdf.path);
      if (url) {
        window.open(url, '_blank');
      }
    }
  };

  const hasFile = pdf.hasFile || (pdf.filename && pdf.path);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded ${hasFile ? 'bg-primary/10' : 'bg-muted'}`}>
            {hasFile ? (
              <FileText className="h-5 w-5 text-primary" />
            ) : (
              <FileX className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2">
              <h4 className="font-medium truncate flex-1">{pdf.title}</h4>
              <Badge variant={hasFile ? "default" : "secondary"} className="text-xs">
                {hasFile ? "With File" : "Title Only"}
              </Badge>
            </div>

            {hasFile && pdf.filename && (
              <div className="bg-muted/50 rounded p-2 mb-2">
                <p className="text-sm font-medium truncate">{pdf.originalName || pdf.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(pdf.size)}
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Created: {new Date(pdf.uploadDate).toLocaleDateString()} at{" "}
              {new Date(pdf.uploadDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {hasFile ? (
            <>
              {onShow && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onShow(pdf)}
                  className="flex-1 gap-2"
                >
                  <Eye className="h-3 w-3" />
                  Show PDF
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className={onShow ? "flex-1 gap-2" : "flex-1 gap-2"}
              >
                <Download className="h-3 w-3" />
                Download
              </Button>
            </>
          ) : (
            <div className="flex-1 text-center py-2 text-sm text-muted-foreground">
              No file attached
            </div>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{pdf.title}"
                  {hasFile && pdf.filename && ` and its attached file "${pdf.originalName || pdf.filename}"`}.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(pdf.id)}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFCardWithTitle;