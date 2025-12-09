import { Heart, ExternalLink } from "lucide-react";
import { SiKofi, SiPaypal } from "react-icons/si";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/appStore";
import { t } from "@/lib/i18n";

export default function Donate() {
  const { language } = useAppStore();

  const handleKofiClick = () => {
    window.open('https://ko-fi.com/footst4ts', '_blank', 'noopener,noreferrer');
  };

  const handlePaypalClick = () => {
    window.open('https://paypal.me/M0012', '_blank', 'noopener,noreferrer');
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
          <p className="text-center text-muted-foreground whitespace-pre-line">
            {t(language, 'donate.description')}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              className="gap-2 bg-[#FF5E5B] hover:bg-[#e54542] text-white"
              onClick={handleKofiClick}
              data-testid="button-kofi"
            >
              <SiKofi className="w-5 h-5" />
              Ko-fi
              <ExternalLink className="w-4 h-4" />
            </Button>

            <Button 
              size="lg" 
              className="gap-2 bg-[#0070BA] hover:bg-[#005ea6] text-white"
              onClick={handlePaypalClick}
              data-testid="button-paypal"
            >
              <SiPaypal className="w-5 h-5" />
              PayPal
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex justify-center pt-4">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center">
              <Heart className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
