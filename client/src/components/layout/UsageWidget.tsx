import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/stores/appStore";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ApiUsage } from "@shared/schema";

export function UsageWidget() {
  const { language, apiUsage, updateApiUsage } = useAppStore();

  const { data } = useQuery<ApiUsage>({
    queryKey: ['/api/football/usage'],
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (data && data.callsToday !== apiUsage.callsToday) {
      updateApiUsage(data);
    }
  }, [data, apiUsage.callsToday, updateApiUsage]);

  const usage = data || apiUsage;
  const percentage = Math.round(usage.percentage * 100);

  const getColorClasses = () => {
    switch (usage.warningLevel) {
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline" 
          className={cn(
            "gap-1.5 font-mono text-xs cursor-default",
            getColorClasses()
          )}
          data-testid="usage-widget"
        >
          <Activity className="w-3 h-3" />
          <span>{usage.callsToday.toLocaleString()}</span>
          <span className="text-muted-foreground">/</span>
          <span>{usage.limit.toLocaleString()}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="font-medium">{t(language, 'common.usage')}</p>
        <p className="text-sm text-muted-foreground">
          {percentage}% - {usage.callsToday.toLocaleString()} {t(language, 'common.callsToday')}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
