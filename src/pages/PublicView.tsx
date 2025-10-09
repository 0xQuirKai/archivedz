import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FileText, Download, Eye, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { publicAPI, pdfAPI, type Box, type PDF } from "@/lib/api";
import { toast } from "sonner";

const PublicView = () => {
  const { boxId } = useParams<{ boxId: string }>();
  const [box, setBox] = useState<Box | null>(null);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPdf, setSelectedPdf] = useState<PDF | null>(null);
  const [showPdfDialog, setShowPdfDialog] = useState(false);

  useEffect(() => {
    if (boxId) {
      loadBoxData();
    }
  }, [boxId]);

  const loadBoxData = async () => {
    if (!boxId) return;

    try {
      const data = await publicAPI.getBoxPublic(boxId);
      setBox(data);
      setPdfs(data.pdfs || []);
    } catch (error) {
      toast.error("Failed to load box");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleDownload = (pdf: PDF) => {
    if (!pdf.path) {
      toast.error("No file available for download");
      return;
    }
    const url = pdfAPI.getDownloadUrl(pdf.path);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleShowPdf = (pdf: PDF) => {
    if (!pdf.path) {
      toast.error("No file available to view");
      return;
    }
    setSelectedPdf(pdf);
    setShowPdfDialog(true);
  };

  const closePdfDialog = () => {
    setShowPdfDialog(false);
    setSelectedPdf(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!box) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Box not found</h1>
          <p className="text-muted-foreground">This box does not exist or has been removed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">{box.name}</h1>
            <p className="text-muted-foreground">
              {pdfs.length} entr{pdfs.length !== 1 ? 'ies' : 'y'} available
            </p>
          </div>

          {pdfs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No entries in this box</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pdfs.map((pdf) => (
                <Card key={pdf.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-2 truncate">{pdf.title}</h3>
                        {pdf.path ? (
                          <>
                            <p className="text-sm text-muted-foreground mb-1">
                              Size: {formatFileSize(pdf.size)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded: {new Date(pdf.uploadDate).toLocaleDateString()}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground mb-1">
                            Title-only entry (no file attached)
                          </p>
                        )}
                      </div>
                    </div>

                    {pdf.path ? (
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => handleShowPdf(pdf)}
                          variant="outline"
                          className="flex-1 gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Show PDF
                        </Button>
                        <Button
                          onClick={() => handleDownload(pdf)}
                          className="flex-1 gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-4 p-3 bg-muted rounded-md text-center">
                        <p className="text-sm text-muted-foreground">
                          No file available
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12 text-sm text-muted-foreground">
            <p>Powered by ArchiveDZ </p>
          </div>
        </div>
      </div>

      {/* PDF Viewer Dialog */}
      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold truncate">
                {selectedPdf?.title || "PDF Viewer"}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={closePdfDialog}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 p-6 pt-4">
            {selectedPdf?.path && (
              <iframe
                src={pdfAPI.getDownloadUrl(selectedPdf.path) || ''}
                className="w-full h-full border rounded-md min-h-[70vh]"
                title={`PDF Viewer - ${selectedPdf.title}`}
              />
            )}
          </div>

          <div className="p-6 pt-0 border-t bg-muted/20">
            <div className="flex justify-between items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {selectedPdf && (
                  <>
                    Size: {formatFileSize(selectedPdf.size)} •
                    Uploaded: {new Date(selectedPdf.uploadDate).toLocaleDateString()}
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={closePdfDialog}
                >
                  Close
                </Button>
                {selectedPdf && (
                  <Button
                    onClick={() => handleDownload(selectedPdf)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicView;
