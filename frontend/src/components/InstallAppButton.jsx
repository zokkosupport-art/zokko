import { useState } from "react";
import { DeviceMobile, ShareNetwork } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePwaInstall } from "@/lib/usePwaInstall";

export default function InstallAppButton() {
  const { canInstall, canNativeInstall, isIosInstall, promptInstall } = usePwaInstall();
  const [iosDialogOpen, setIosDialogOpen] = useState(false);

  if (!canInstall) return null;

  const handleClick = async () => {
    if (canNativeInstall) {
      await promptInstall();
    } else if (isIosInstall) {
      setIosDialogOpen(true);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleClick}
        className="rounded-full border-2 border-[#E5E0D8] font-semibold text-[#1A2E22] hover:text-[#D84315] hover:border-[#D84315]/40 px-3"
        data-testid="pwa-install-btn"
        title="Installer Zokko"
        aria-label="Installer Zokko"
      >
        <DeviceMobile size={18} weight="bold" />
        <span className="hidden lg:inline ml-1.5">Installer l&apos;app</span>
      </Button>

      <Dialog open={iosDialogOpen} onOpenChange={setIosDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#1A2E22]">Installer Zokko</DialogTitle>
            <DialogDescription asChild>
              <div className="text-[#4A5D50] text-left space-y-3 pt-1 text-sm">
                <p>Ajoutez Zokko à votre écran d&apos;accueil pour y accéder comme une application.</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>
                    Appuyez sur <ShareNetwork size={16} weight="bold" className="inline text-[#D84315] align-text-bottom" aria-hidden />{" "}
                    <strong>Partager</strong> en bas de Safari
                  </li>
                  <li>
                    Choisissez <strong>Sur l&apos;écran d&apos;accueil</strong>
                  </li>
                  <li>
                    Confirmez avec <strong>Ajouter</strong>
                  </li>
                </ol>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
