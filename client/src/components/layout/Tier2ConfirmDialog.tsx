import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppStore } from "@/stores/appStore";
import { t } from "@/lib/i18n";

export function Tier2ConfirmDialog() {
  const { 
    language, 
    tier2ConfirmPending, 
    setTier2ConfirmPending, 
    setShowTier2 
  } = useAppStore();

  const handleConfirm = () => {
    setShowTier2(true);
  };

  const handleCancel = () => {
    setTier2ConfirmPending(false);
  };

  return (
    <AlertDialog open={tier2ConfirmPending} onOpenChange={setTier2ConfirmPending}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t(language, 'common.tier2')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(language, 'common.tier2Warning')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {t(language, 'common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {t(language, 'common.enable')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
