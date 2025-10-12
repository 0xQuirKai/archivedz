import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import Header from "@/components/Header";
import BoxCard from "@/components/BoxCard";
import CreateBoxDialog from "@/components/CreateBoxDialog";
import EditBoxDialog from "@/components/EditBoxDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { boxAPI, type Box } from "@/lib/api";
import { isRetentionDateClose } from "@/lib/utils";
import { toast } from "sonner";

const Dashboard = () => {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [filteredBoxes, setFilteredBoxes] = useState<Box[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBox, setEditingBox] = useState<Box | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/auth');
      return;
    }
    loadBoxes()
  }, [navigate]);

  useEffect(() => {
    if (searchQuery) {
      setFilteredBoxes(
        boxes.filter((box) =>
          box.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredBoxes(boxes);
    }
  }, [searchQuery, boxes]);

  const loadBoxes = async () => {
    try {
      const data = await boxAPI.getAll();
      setBoxes(data);
      setFilteredBoxes(data);

      // Check for expiring boxes
      const expiringBoxes = data.filter(box => box.retentionDate && isRetentionDateClose(box.retentionDate));
      if (expiringBoxes.length > 0) {
        toast.warning(`You have ${expiringBoxes.length} box(es) with retention date expiring soon.`, {
          description: expiringBoxes.map(box => box.name).join(', '),
        });
      }
    } catch (error) {
      toast.error("Failed to load boxes");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBox = async (name: string, retentionDate?: string, status?: string) => {
    try {
      await boxAPI.create(name, retentionDate, status);
      toast.success("Box created successfully");
      loadBoxes();
    } catch (error) {
      toast.error("Failed to create box");
      throw error;
    }
  };

  const handleDeleteBox = async (boxId: string) => {
    try {
      await boxAPI.delete(boxId);
      toast.success("Box deleted successfully");
      loadBoxes();
    } catch (error) {
      toast.error("Failed to delete box");
      throw error;
    }
  };

  const handleEditBox = (box: Box) => {
    setEditingBox(box);
    setIsEditDialogOpen(true);
  };

  const handleUpdateBox = async (boxId: string, name: string, retentionDate?: string, status?: string) => {
    try {
      await boxAPI.update(boxId, name, retentionDate, status);
      toast.success("Box updated successfully");
      loadBoxes();
    } catch (error) {
      toast.error("Failed to update box");
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold">My Boxes</h2>
              <p className="text-muted-foreground">
                Organize your PDFs in digital boxes
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Box
            </Button>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search boxes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading boxes...</p>
            </div>
          ) : filteredBoxes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "No boxes found" : "No boxes yet. Create your first one!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBoxes.map((box) => (
                <BoxCard
                  key={box.id}
                  box={box}
                  onDelete={handleDeleteBox}
                  onEdit={handleEditBox}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateBoxDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreate={handleCreateBox}
      />

      <EditBoxDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        box={editingBox}
        onEdit={handleUpdateBox}
      />
    </div>
  );
};

export default Dashboard;
