import { useNavigate } from "react-router-dom";
import { Box, Lock, QrCode, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-4 rounded-2xl">
              <img src="/logo.png" alt="Logo" className="h-28 w-28" />
            </div>
            <h1 className="text-5xl font-bold">Archive Dz</h1>
          </div>

          <p className="text-xl text-muted-foreground mb-8">
            Organize, share, and access your PDF files with QR codes
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" onClick={() => (token ? navigate("/dashboard") : navigate("/auth"))} className="gap-2">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => (token ? navigate("/dashboard") : navigate("/auth"))}>
              Sign In
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Card className="border-2">
              <CardContent className="pt-6 text-center">
                <div className="bg-primary/10 p-3 rounded-lg w-fit mx-auto mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Upload PDFs</h3>
                <p className="text-sm text-muted-foreground">
                  Organize your documents in custom boxes with drag-and-drop upload
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6 text-center">
                <div className="bg-primary/10 p-3 rounded-lg w-fit mx-auto mb-4">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Generate QR Codes</h3>
                <p className="text-sm text-muted-foreground">
                  Get unique QR codes for each box to share your documents easily
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6 text-center">
                <div className="bg-primary/10 p-3 rounded-lg w-fit mx-auto mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Secure Access</h3>
                <p className="text-sm text-muted-foreground">
                  Your documents are protected with authentication and secure storage
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
