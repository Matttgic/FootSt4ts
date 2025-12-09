import { AlertCircle } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { t } from "@/lib/i18n";

export function Footer() {
  const { language } = useAppStore();

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{t(language, 'footer.disclaimer')}</span>
        </div>
      </div>
    </footer>
  );
}
