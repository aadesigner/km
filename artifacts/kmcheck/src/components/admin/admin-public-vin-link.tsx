import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publicVinPagePath } from "@/lib/public-vin-page";
import { cn } from "@/lib/utils";

type AdminPublicVinLinkProps = {
  vin: string;
  label?: string;
  compact?: boolean;
  className?: string;
};

/** Real public VIN page link — not the admin editor. */
export function AdminPublicVinLink({
  vin,
  label = "View page",
  compact = false,
  className,
}: AdminPublicVinLinkProps) {
  const href = publicVinPagePath(vin);
  return (
    <Button
      asChild
      size="sm"
      variant={compact ? "ghost" : "outline"}
      className={cn(
        "gap-1",
        compact ? "text-xs h-7" : "h-8",
        className,
      )}
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="h-3.5 w-3.5" />
        {label}
      </a>
    </Button>
  );
}
