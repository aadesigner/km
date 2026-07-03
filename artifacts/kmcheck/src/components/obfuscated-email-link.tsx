import { Fragment, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getSupportEmail } from "@/lib/support-email";

type Props = {
  className?: string;
};

/** Renders support email only after mount; mailto opens on click (not in static HTML). */
export function ObfuscatedEmailLink({ className }: Props) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setEmail(getSupportEmail());
  }, []);

  if (!email) {
    return <span className={cn("inline-block min-w-[8ch]", className)} aria-hidden />;
  }

  return (
    <a
      href="#"
      className={cn("text-primary hover:underline", className)}
      rel="nofollow noopener"
      onClick={(e) => {
        e.preventDefault();
        window.location.href = `mailto:${getSupportEmail()}`;
      }}
    >
      {email}
    </a>
  );
}

const EMAIL_PLACEHOLDER = "{{email}}";

/** Splits translated copy on `{{email}}` and inserts an obfuscated mail link. */
export function TextWithObfuscatedEmail({
  text,
  linkClassName,
}: {
  text: string;
  linkClassName?: string;
}) {
  if (!text.includes(EMAIL_PLACEHOLDER)) {
    return <>{text}</>;
  }

  const parts = text.split(EMAIL_PLACEHOLDER);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 ? <ObfuscatedEmailLink className={linkClassName} /> : null}
        </Fragment>
      ))}
    </>
  );
}
