import { FileText, Download, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type PDF, pdfAPI } from "@/lib/api";
import { useTranslation } from "react-i18next";
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

interface PDFCardProps {
  pdf: PDF;
  onDelete: (pdfId: string) => void;
}

const PDFCard = ({ pdf, onDelete }: PDFCardProps) => {
  const { t } = useTranslation();
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleDownload = () => {
    const url = pdfAPI.getDownloadUrl(pdf.path);
    window.open(url, '_blank');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 p-2 rounded">
            <FileText className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate mb-1">{pdf.filename}</h4>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(pdf.size)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(pdf.uploadDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex-1 gap-2"
          >
            <Download className="h-3 w-3" />
            {t('box.download')}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('box.deletePdf')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('box.deletePdfWarning', { name: pdf.filename })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('box.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(pdf.id)}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {t('box.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFCard;
