import { cn } from "@/lib/utils";

interface TeamLogoProps {
  name: string;
  logo: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export function TeamLogo({ name, logo, size = "md", className }: TeamLogoProps) {
  if (!logo) {
    return (
      <div 
        className={cn(
          "rounded-md bg-muted flex items-center justify-center text-xs font-medium",
          sizeClasses[size],
          className
        )}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={name}
      className={cn(sizeClasses[size], "object-contain", className)}
    />
  );
}
