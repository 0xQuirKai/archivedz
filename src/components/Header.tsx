import { Box, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@/lib/api";
import { toast } from "sonner";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

interface HeaderProps {
  showLogout?: boolean;
}

const Header = ({ showLogout = true }: HeaderProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    authAPI.logout();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="p-2 rounded-lg">
            <img src="/logo.png" alt="Logo" className="h-16 w-16" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Archive DZ</h1>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {showLogout && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              {t('common.logout')}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
