import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

interface CreateBoxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, retentionDate?: string, status?: string) => Promise<void>;
}

const CreateBoxDialog = ({ open, onOpenChange, onCreate }: CreateBoxDialogProps) => {
  const { t } = useTranslation();
  const [boxName, setBoxName] = useState("");
  const [retentionDate, setRetentionDate] = useState("");
  const [status, setStatus] = useState("active");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boxName.trim()) return;

    setIsLoading(true);
    try {
      await onCreate(boxName, retentionDate || undefined, status);
      setBoxName("");
      setRetentionDate("");
      setStatus("active");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('box.createNewBox')}</DialogTitle>
            <DialogDescription>
              {t('box.giveBoxName')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="box-name">{t('box.boxName')}</Label>
                <Input
                  id="box-name"
                  placeholder="e.g., Work Documents"
                  value={boxName}
                  onChange={(e) => setBoxName(e.target.value)}
                  className="mt-2"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="retention-date">{t('box.retentionDate')}</Label>
                <Input
                  id="retention-date"
                  type="date"
                  value={retentionDate}
                  onChange={(e) => setRetentionDate(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="status">{t('box.status')}</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={t('box.selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owned">{t('box.owned')}</SelectItem>
                    <SelectItem value="restricted">{t('box.restricted')}</SelectItem>
                    <SelectItem value="borrowed">{t('box.borrowed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('box.cancel')}
            </Button>
            <Button type="submit" disabled={!boxName.trim() || isLoading}>
              {isLoading ? t('box.creating') : t('box.createBox')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBoxDialog;
