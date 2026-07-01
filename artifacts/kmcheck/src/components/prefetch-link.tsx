import { Link, type LinkProps } from "wouter";
import { prefetchRouteFromHref } from "@/lib/prefetch-route";
import { prefetchVinFromHref } from "@/lib/prefetch-vin-report";
import { queryClient } from "@/lib/query-client";
import { useAuth } from "@/lib/auth-context";

type Props = LinkProps & {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

/** wouter Link that prefetches the target page chunk (and VIN data when applicable) on hover/focus. */
export function PrefetchLink({ href, children, className, onClick, ...rest }: Props) {
  const { isSignedIn } = useAuth();
  const path = typeof href === "string" ? href : "";

  const warmHref = () => {
    prefetchRouteFromHref(path, { isSignedIn });
    prefetchVinFromHref(queryClient, path, { isSignedIn });
  };

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={warmHref}
      onFocus={warmHref}
      onClick={onClick}
      {...rest}
    >
      {children}
    </Link>
  );
}
