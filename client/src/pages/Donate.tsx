import { Heart, Coffee, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/appStore";
import { t } from "@/lib/i18n";

export default function Donate() {
  const { language } = useAppStore();

  const handleDonateClick = () => {
    window.open('https://www.buymeacoffee.com/footstats', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold">{t(language, 'donate.title')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            {t(language, 'donate.thanks')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            {t(language, 'donate.description')}
          </p>

          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-black"
              onClick={handleDonateClick}
              data-testid="button-donate"
            >
              <Coffee className="w-5 h-5" />
              {t(language, 'donate.coffeeButton')}
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex justify-center pt-4">
            <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center">
              <Coffee className="w-12 h-12 text-amber-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
