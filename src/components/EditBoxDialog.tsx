import { useState, useEffect } from "react";
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
import { type Box } from "@/lib/api";

interface EditBoxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  box: Box | null;
  onEdit: (boxId: string, name: string, retentionDate?: string, status?: string) => Promise<void>;
}

const EditBoxDialog = ({ open, onOpenChange, box, onEdit }: EditBoxDialogProps) => {
  const [boxName, setBoxName] = useState("");
  const [retentionDate, setRetentionDate] = useState("");
  const [status, setStatus] = useState("active");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (box) {
      setBoxName(box.name);
      setRetentionDate(box.retentionDate ? new Date(box.retentionDate).toISOString().split('T')[0] : "");
      setStatus(box.status);
    }
  }, [box]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boxName.trim() || !box) return;

    setIsLoading(true);
    try {
      await onEdit(box.id, boxName, retentionDate || undefined, status);
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
            <DialogTitle>Edit Box</DialogTitle>
            <DialogDescription>
              Update the box details
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-box-name">Box Name</Label>
                <Input
                  id="edit-box-name"
                  placeholder="e.g., Work Documents"
                  value={boxName}
                  onChange={(e) => setBoxName(e.target.value)}
                  className="mt-2"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="edit-retention-date">Retention Date (Optional)</Label>
                <Input
                  id="edit-retention-date"
                  type="date"
                  value={retentionDate}
                  onChange={(e) => setRetentionDate(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owned">Owned</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                    <SelectItem value="borrowed">Borrowed</SelectItem>
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
              Cancel
            </Button>
            <Button type="submit" disabled={!boxName.trim() || isLoading}>
              {isLoading ? "Updating..." : "Update Box"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBoxDialog;