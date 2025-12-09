import { AlertTriangle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppStore } from "@/stores/appStore";
import { t } from "@/lib/i18n";

export function UsageBanner() {
  const { language, apiUsage } = useAppStore();

  if (apiUsage.warningLevel === 'normal') {
    return null;
  }

  const isCritical = apiUsage.warningLevel === 'critical';

  return (
    <Alert 
      variant={isCritical ? "destructive" : "default"}
      className={isCritical 
        ? "border-red-500 bg-red-500/10" 
        : "border-amber-500 bg-amber-500/10"
      }
    >
      {isCritical ? (
        <XCircle className="h-4 w-4 text-red-500" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-amber-500" />
      )}
      <AlertDescription className={isCritical ? "text-red-500" : "text-amber-500"}>
        {isCritical 
          ? t(language, 'common.criticalBanner')
          : t(language, 'common.warningBanner')
        }
      </AlertDescription>
    </Alert>
  );
}
