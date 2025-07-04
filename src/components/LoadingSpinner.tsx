interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = "md",
  message = "Memuat...",
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const container = fullScreen ? "min-h-screen" : "min-h-[200px]";

  return (
    <div
      className={`${container} bg-background flex items-center justify-center`}
    >
      <div className="text-center">
        <div
          className={`${sizeClasses[size]} border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4`}
        ></div>
        <p className="text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}
