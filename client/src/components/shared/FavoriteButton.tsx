import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";
import type { Favorite } from "@shared/schema";

interface FavoriteButtonProps {
  type: 'player' | 'team';
  id: number;
  name: string;
  logo?: string | null;
  className?: string;
}

export function FavoriteButton({ type, id, name, logo, className }: FavoriteButtonProps) {
  const { isFavorite, addFavorite, removeFavorite } = useAppStore();
  const isActive = isFavorite(type, id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive) {
      removeFavorite(type, id);
    } else {
      const favorite: Favorite = { type, id, name, logo };
      addFavorite(favorite);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={handleClick}
      data-testid={`favorite-${type}-${id}`}
    >
      <Star 
        className={cn(
          "w-4 h-4 transition-colors",
          isActive ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
        )} 
      />
    </Button>
  );
}
