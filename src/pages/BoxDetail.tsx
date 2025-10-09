import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, QrCode, FileText, Download, X } from "lucide-react";
import Header from "@/components/Header";
import PDFCardWithTitle from "@/components/PDFCardWithTitle";
import UploadZoneWithTitle from "@/components/UploadZoneWithTitle";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { boxAPI, pdfAPI, type Box, type PDF } from "@/lib/api";
import { toast } from "sonner";

const BoxDetail = () => {
  const { boxId } = useParams<{ boxId: string }>();
  const navigate = useNavigate();
  const [box, setBox] = useState<Box | null>(null);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<PDF | null>(null);
  const [showPdfDialog, setShowPdfDialog] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/auth');
      return;
    }
    if (boxId) {
      loadBoxDetails();
    }
  }, [boxId, navigate]);

  const loadBoxDetails = async () => {
    if (!boxId) return;

    try {
      const data = await boxAPI.getById(boxId);
      setBox(data);
      setPdfs(data.pdfs || []);
    } catch (error) {
      toast.error("Failed to load box details");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadWithFiles = async (files: File[], title: string) => {
    if (!boxId) return;

    try {
      const uploadedEntries = await pdfAPI.upload(boxId, files, title);
      toast.success(`Uploaded "${title}" with ${files.length} file(s)`);
      setShowUpload(false);
      // Add new entries to the beginning of the list
      setPdfs(prev => [...uploadedEntries, ...prev]);
    } catch (error) {
      toast.error("Upload failed");
      throw error;
    }
  };

  const handleTitleOnly = async (title: string) => {
    if (!boxId) return;

    try {
      const newEntry = await pdfAPI.createTitleOnly(boxId, title);
      toast.success(`Created title-only entry: "${title}"`);
      setShowUpload(false);
      // Add new entry to the beginning of the list
      setPdfs(prev => [newEntry, ...prev]);
    } catch (error) {
      toast.error("Failed to create entry");
      throw error;
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!boxId) return;

    try {
      await pdfAPI.delete(boxId, entryId);
      toast.success("Entry deleted successfully");
      // Remove the deleted entry from the local state
      setPdfs(prev => prev.filter(pdf => pdf.id !== entryId));
    } catch (error) {
      toast.error("Failed to delete entry");
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!box) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Box not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold">{box.name}</h2>
              <p className="text-muted-foreground">
                {pdfs.length} entr{pdfs.length !== 1 ? 'ies' : 'y'} in this box
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowQR(true)}
                variant="outline"
                className="gap-2"
              >
                <QrCode className="h-4 w-4" />
                QR Code
              </Button>
              <Button
                onClick={() => setShowUpload(true)}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Add Entry
              </Button>
            </div>
          </div>

          {showUpload && (
            <UploadZoneWithTitle
              onUpload={handleUploadWithFiles}
              onTitleOnly={handleTitleOnly}
              onCancel={() => setShowUpload(false)}
            />
          )}

          {pdfs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No entries in this box yet</p>
              <Button onClick={() => setShowUpload(true)} className="gap-2">
                <Upload className="h-4 w-4" />
                Add your first entry
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pdfs.map((pdf) => (
                <PDFCardWithTitle
                  key={pdf.id}
                  pdf={pdf}
                  onDelete={handleDeleteEntry}
                  onShow={handleShowPdf}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {boxId && (
        <QRCodeDisplay
          boxId={boxId}
          open={showQR}
          onOpenChange={setShowQR}
        />
      )}

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
                    onClick={() => {
                      if (selectedPdf.path) {
                        const url = pdfAPI.getDownloadUrl(selectedPdf.path);
                        if (url) {
                          window.open(url, '_blank');
                        }
                      }
                    }}
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

export default BoxDetail;
