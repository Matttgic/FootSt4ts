import { Star, Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/stores/appStore";
import { t } from "@/lib/i18n";

export function FavoritesFilter() {
  const { 
    language, 
    showFavoritesOnly, 
    setShowFavoritesOnly,
    highlightFavorites,
    setHighlightFavorites,
    favorites,
  } = useAppStore();

  if (favorites.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <Checkbox 
          id="showFavoritesOnly" 
          checked={showFavoritesOnly}
          onCheckedChange={(checked) => setShowFavoritesOnly(checked === true)}
          data-testid="checkbox-favorites-only"
        />
        <Label htmlFor="showFavoritesOnly" className="text-sm flex items-center gap-1.5 cursor-pointer">
          <Star className="w-3.5 h-3.5" />
          {t(language, 'common.showFavoritesOnly')}
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox 
          id="highlightFavorites" 
          checked={highlightFavorites}
          onCheckedChange={(checked) => setHighlightFavorites(checked === true)}
          data-testid="checkbox-favorites-highlight"
        />
        <Label htmlFor="highlightFavorites" className="text-sm flex items-center gap-1.5 cursor-pointer">
          <Eye className="w-3.5 h-3.5" />
          {t(language, 'common.highlightFavorites')}
        </Label>
      </div>
    </div>
  );
}
