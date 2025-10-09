import { Box, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@/lib/api";
import { toast } from "sonner";

interface HeaderProps {
  showLogout?: boolean;
}

const Header = ({ showLogout = true }: HeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authAPI.logout();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => navigate("/")}
        >
          <div className="bg-primary p-2 rounded-lg">
            <Box className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Digital PDF Boxes</h1>
        </div>
        
        {showLogout && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
