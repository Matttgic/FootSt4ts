import { Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/stores/appStore";
import { t } from "@/lib/i18n";

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ message, icon }: EmptyStateProps) {
  const { language } = useAppStore();

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
        {icon || <Inbox className="w-12 h-12 text-muted-foreground" />}
        <p className="text-muted-foreground">
          {message || t(language, 'common.noData')}
        </p>
      </CardContent>
    </Card>
  );
}
