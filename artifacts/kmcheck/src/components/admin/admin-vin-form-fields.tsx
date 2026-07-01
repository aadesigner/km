import { useId, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function AdminField({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5 min-w-0", className)}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {hint ? <p className="text-[10px] leading-snug text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function AdminTextField({
  label,
  hint,
  value,
  onChange,
  type = "text",
  placeholder = "—",
  suggestions,
  compact,
  className,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  suggestions?: string[];
  compact?: boolean;
  className?: string;
}) {
  const listId = useId();
  const inputClass = compact ? "h-8 text-xs" : "h-9 text-sm";

  return (
    <AdminField label={label} hint={hint} className={className}>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        list={suggestions?.length ? listId : undefined}
        className={inputClass}
      />
      {suggestions?.length ? (
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      ) : null}
    </AdminField>
  );
}

export function AdminSelectField({
  label,
  hint,
  value,
  onChange,
  options,
  compact,
  className,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  compact?: boolean;
  className?: string;
}) {
  return (
    <AdminField label={label} hint={hint} className={className}>
      <select
        className={cn(
          "w-full rounded-md border bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring",
          compact ? "h-8 text-xs" : "h-9 text-sm",
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value || "__empty"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </AdminField>
  );
}

export function AdminCheckField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer rounded-lg border bg-muted/20 px-3 py-2.5 hover:bg-muted/30 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-input"
      />
      <span className="min-w-0">
        <span className="text-sm font-medium leading-none">{label}</span>
        {hint ? <span className="block text-[10px] text-muted-foreground mt-1">{hint}</span> : null}
      </span>
    </label>
  );
}
