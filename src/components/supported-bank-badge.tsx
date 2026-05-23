import { Badge } from "@/components/ui/badge";
import { formatMessage } from "@/i18n/format";
import { cn } from "@/lib/utils";

const SUPPORTED_BANKS = [
  { id: "scb", label: "SCB", color: "#4e2e7f" },
  { id: "kbank", label: "KBank", color: "#138f2d" },
  { id: "ktb", label: "KTB", color: "#1ba5e1" },
] as const;

type SupportedBankBadgeProps = {
  bank: (typeof SUPPORTED_BANKS)[number];
  bankLogoAlt: string;
  className?: string;
};

function SupportedBankBadge({
  bank,
  bankLogoAlt,
  className,
}: SupportedBankBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn("h-auto gap-1.5 py-1 pl-1 pr-2.5", className)}
    >
      <span
        className="flex size-5 shrink-0 items-center justify-center rounded-sm"
        style={{ backgroundColor: bank.color }}
      >
        <img
          src={`/logos/banks/${bank.id}.svg`}
          alt={formatMessage(bankLogoAlt, { bank: bank.label })}
          width={14}
          height={14}
          className="size-3.5 object-contain"
        />
      </span>
      <span aria-hidden="true">{bank.label}</span>
    </Badge>
  );
}

export function SupportedBankBadges({
  bankLogoAlt,
  className,
}: {
  bankLogoAlt: string;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-center gap-2 flex-wrap", className)}>
      {SUPPORTED_BANKS.map((bank) => (
        <SupportedBankBadge
          key={bank.id}
          bank={bank}
          bankLogoAlt={bankLogoAlt}
        />
      ))}
    </div>
  );
}
