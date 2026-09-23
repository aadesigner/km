import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminTheme } from "@/components/admin/admin-theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AdminThemePicker({
  className,
  toolbar = false,
}: {
  className?: string;
  /** Icon-only control for the desktop floating toolbar */
  toolbar?: boolean;
}) {
  const { themeId, theme, themes, setThemeId } = useAdminTheme();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "text-muted-foreground transition-colors hover:text-foreground",
            toolbar
              ? "h-8 w-8 rounded-full hover:bg-muted"
              : "w-full gap-3 rounded-xl px-3 py-2.5 hover:bg-muted text-sm font-medium",
            className,
          )}
          aria-label={`Admin theme: ${theme.name}`}
          title={theme.name}
        >
          <Palette className="h-4 w-4 shrink-0" />
          {!toolbar ? (
            <span className="flex-1 min-w-0 text-left truncate text-foreground/90">{theme.name}</span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={toolbar ? "end" : "start"}
        className="w-44"
        side="top"
        sideOffset={toolbar ? 10 : 4}
      >
        {themes.map((item) => {
          const active = item.id === themeId;
          return (
            <DropdownMenuItem
              key={item.id}
              onSelect={() => setThemeId(item.id)}
              className={cn("cursor-pointer gap-2 py-2", active && "bg-accent/60")}
            >
              <span className="flex-1 text-sm font-medium">{item.name}</span>
              {active ? <Check className="h-3.5 w-3.5 text-primary shrink-0" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
