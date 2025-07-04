import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MobileHeader } from "@/components/MobileHeader";
import { Home, AlertCircle, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Log 404 error for monitoring (in production, send to error tracking service)
    if (process.env.NODE_ENV === "production") {
      console.error("404 Error:", {
        path: location.pathname,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Halaman Tidak Ditemukan" showTime={false} />

      <div className="p-4 pt-8 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md shadow-card border border-border bg-gradient-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-warning/10 rounded-full p-4">
                <AlertCircle className="w-12 h-12 text-warning" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-foreground mb-2">
              404
            </CardTitle>
            <p className="text-lg text-muted-foreground">
              Halaman Tidak Ditemukan
            </p>
          </CardHeader>

          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Maaf, halaman yang Anda cari tidak dapat ditemukan atau mungkin
              telah dipindahkan.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="h-12"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              <Button
                onClick={() => navigate("/")}
                className="h-12 bg-gradient-primary"
              >
                <Home className="w-4 h-4 mr-2" />
                Beranda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
