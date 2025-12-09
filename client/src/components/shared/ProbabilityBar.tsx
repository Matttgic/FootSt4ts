import { cn } from "@/lib/utils";
import { formatProbability } from "@/lib/probability";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/stores/appStore";
import { t } from "@/lib/i18n";
import type { PlayerProbability } from "@shared/schema";

interface ProbabilityBarProps {
  probability: number;
  label: string;
  dataQuality?: 'sufficient' | 'insufficient';
  factors?: PlayerProbability['factors'];
  className?: string;
}

export function ProbabilityBar({ 
  probability, 
  label, 
  dataQuality = 'sufficient',
  factors,
  className 
}: ProbabilityBarProps) {
  const { language } = useAppStore();
  const percentage = Math.round(probability * 100);
  
  const getBarColor = () => {
    if (dataQuality === 'insufficient') return 'bg-muted';
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const BarContent = (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn(
          "font-mono font-medium",
          dataQuality === 'insufficient' ? "text-muted-foreground" : ""
        )}>
          {dataQuality === 'insufficient' ? '--' : formatProbability(probability)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all", getBarColor())}
          style={{ width: dataQuality === 'insufficient' ? '0%' : `${percentage}%` }}
        />
      </div>
    </div>
  );

  if (!factors) {
    return BarContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {BarContent}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-medium mb-2">{t(language, 'probability.factors')}</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span>{t(language, 'probability.goalsPer90')}:</span>
            <span className="font-mono">{factors.goalsPer90.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>{t(language, 'probability.assistsPer90')}:</span>
            <span className="font-mono">{factors.assistsPer90.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>{t(language, 'probability.recentForm')}:</span>
            <span className="font-mono">{factors.goalsLastN.toFixed(1)} G / {factors.assistsLastN.toFixed(1)} A</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>{t(language, 'probability.teamAttack')}:</span>
            <span className="font-mono">{(factors.teamAttackFactor * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>{t(language, 'probability.opponentDefense')}:</span>
            <span className="font-mono">{(factors.opponentDefenseWeakness * 100).toFixed(0)}%</span>
          </div>
          {factors.homeBoost > 0 && (
            <div className="flex justify-between gap-4">
              <span>{t(language, 'probability.homeBoost')}:</span>
              <span className="font-mono text-green-500">+{(factors.homeBoost * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
