import { useState } from "react";
import { Mail, Send, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAppStore } from "@/stores/appStore";
import { t } from "@/lib/i18n";


export default function Contact() {
  const { language } = useAppStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: name || 'Anonymous',
          email: email || 'No email provided',
          message
        }),
      });
      
      if (response.ok) {
        setIsSubmitted(true);
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setError(language === 'fr' ? 'Erreur lors de l\'envoi. Réessayez.' : 'Failed to send. Please try again.');
      }
    } catch (err) {
      console.error('Failed to submit contact form:', err);
      setError(language === 'fr' ? 'Erreur de connexion. Réessayez.' : 'Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold">{t(language, 'contact.title')}</h1>
        <p className="text-muted-foreground mt-2">{t(language, 'contact.description')}</p>
      </div>

      {isSubmitted && (
        <Alert className="bg-green-500/10 border-green-500/20">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-600 dark:text-green-400">
            {t(language, 'common.messageSent')}
          </AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-400">
            {t(language, 'common.messageSentDesc')}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="bg-red-500/10 border-red-500/20">
          <AlertDescription className="text-red-600 dark:text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            {t(language, 'contact.formTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {t(language, 'common.name')} 
                <span className="text-muted-foreground text-xs ml-1">({t(language, 'common.optional')})</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                {t(language, 'common.email')} 
                <span className="text-muted-foreground text-xs ml-1">({t(language, 'common.optional')})</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t(language, 'common.message')} *</Label>
              <Textarea
                id="message"
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={language === 'fr' ? "Votre message..." : "Your message..."}
                rows={5}
                required
                data-testid="input-message"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full gap-2"
              disabled={isSubmitting || !message.trim()}
              data-testid="button-submit"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? t(language, 'common.loading') : t(language, 'common.send')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
