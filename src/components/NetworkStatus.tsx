import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff, Wifi } from "lucide-react";

export function NetworkStatus() {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  if (isOnline && !isSlowConnection) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50">
      {!isOnline ? (
        <Alert
          variant="destructive"
          className="bg-destructive/90 backdrop-blur-sm border-destructive"
        >
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="text-destructive-foreground font-medium">
            Tidak ada koneksi internet. Beberapa fitur mungkin tidak berfungsi.
          </AlertDescription>
        </Alert>
      ) : isSlowConnection ? (
        <Alert
          variant="default"
          className="bg-warning/90 backdrop-blur-sm border-warning text-warning-foreground"
        >
          <Wifi className="h-4 w-4" />
          <AlertDescription className="font-medium">
            Koneksi internet lambat. Aplikasi mungkin lebih lambat dari
            biasanya.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
