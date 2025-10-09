import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { boxAPI } from "@/lib/api";
import { toast } from "sonner";

interface QRCodeDisplayProps {
  boxId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QRCodeDisplay = ({ boxId, open, onOpenChange }: QRCodeDisplayProps) => {
  const [qrCode, setQrCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && boxId) {
      loadQRCode();
    }
  }, [open, boxId]);

  const loadQRCode = async () => {
    setIsLoading(true);
    try {
      const data = await boxAPI.getQRCode(boxId);
      setQrCode(data.qrCode);
    } catch (error) {
      toast.error("Failed to load QR code");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrCode) return;
    
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `box-${boxId}-qr.png`;
    link.click();
  };

  const publicUrl = `${window.location.origin}/view/${boxId}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Box QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code to view the PDFs in this box
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Loading QR code...</p>
            </div>
          ) : qrCode ? (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-lg">
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
              
              <div className="text-center w-full">
                <p className="text-sm text-muted-foreground mb-2">
                  Or share this link:
                </p>
                <code className="text-xs bg-muted px-3 py-2 rounded block break-all">
                  {publicUrl}
                </code>
              </div>

              <Button onClick={handleDownload} className="w-full gap-2">
                <Download className="h-4 w-4" />
                Download QR Code
              </Button>
            </div>
          ) : (
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Failed to load QR code</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDisplay;
