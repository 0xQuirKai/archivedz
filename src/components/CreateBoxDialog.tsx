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

interface CreateBoxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => Promise<void>;
}

const CreateBoxDialog = ({ open, onOpenChange, onCreate }: CreateBoxDialogProps) => {
  const [boxName, setBoxName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boxName.trim()) return;

    setIsLoading(true);
    try {
      await onCreate(boxName);
      setBoxName("");
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
            <DialogTitle>Create New Box</DialogTitle>
            <DialogDescription>
              Give your box a name to organize your PDFs
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="box-name">Box Name</Label>
            <Input
              id="box-name"
              placeholder="e.g., Work Documents"
              value={boxName}
              onChange={(e) => setBoxName(e.target.value)}
              className="mt-2"
              autoFocus
            />
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
              {isLoading ? "Creating..." : "Create Box"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBoxDialog;
