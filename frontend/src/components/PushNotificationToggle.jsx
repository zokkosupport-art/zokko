import { Bell, BellSlash, BellRinging } from "@phosphor-icons/react";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/lib/usePushNotifications";

const STATUS_LABELS = {
  loading: "Vérification…",
  logged_out: "Connectez-vous pour activer les notifications",
  unsupported: "Non supporté sur ce navigateur",
  unavailable: "Notifications push indisponibles (configuration serveur)",
  denied: "Refusées — autorisez-les dans les paramètres du navigateur",
  prompt: "Désactivées",
  disabled: "Désactivées",
  enabled: "Activées",
};

export default function PushNotificationToggle() {
  const { status, busy, error, isSupported, isEnabled, toggle } = usePushNotifications();

  const canToggle = isSupported && status !== "denied" && status !== "unavailable" && status !== "loading";

  const handleSwitch = async (checked) => {
    if (busy) return;
    if (checked && !isEnabled) {
      await toggle();
    } else if (!checked && isEnabled) {
      await toggle();
    }
  };

  const Icon = status === "enabled" ? BellRinging : status === "denied" ? BellSlash : Bell;

  return (
    <div
      className="bg-white border border-[#E5E0D8] rounded-2xl p-5 mb-4"
      data-testid="push-notification-toggle"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3 min-w-0">
          <Icon
            size={24}
            weight={status === "enabled" ? "fill" : "duotone"}
            className={status === "enabled" ? "text-[#2E7D32] shrink-0 mt-0.5" : "text-[#D84315] shrink-0 mt-0.5"}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="font-heading font-semibold text-lg text-[#1A2E22]">Notifications push</p>
            <p className="text-sm text-[#4A5D50] mt-1">
              Recevez des alertes même quand Zokko n&apos;est pas ouvert (messages, annonces validées…).
            </p>
            <p
              className={`text-xs mt-2 font-medium ${
                status === "enabled"
                  ? "text-[#2E7D32]"
                  : status === "denied"
                    ? "text-[#C62828]"
                    : "text-[#4A5D50]"
              }`}
              data-testid="push-notification-status"
            >
              {STATUS_LABELS[status] || STATUS_LABELS.prompt}
            </p>
            {error && <p className="text-xs text-[#C62828] mt-1">{error}</p>}
          </div>
        </div>
        {canToggle && (
          <Switch
            checked={isEnabled}
            onCheckedChange={handleSwitch}
            disabled={busy}
            aria-label="Activer les notifications push"
            data-testid="push-notification-switch"
            className="data-[state=checked]:bg-[#2E7D32]"
          />
        )}
      </div>
      {!canToggle && status === "denied" && (
        <p className="text-xs text-[#4A5D50] mt-3 pl-9">
          Sur Android Chrome : Paramètres du site → Notifications → Autoriser.
        </p>
      )}
    </div>
  );
}
