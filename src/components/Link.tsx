import { Link as TanstackLink } from "@tanstack/react-router";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type LinkProps = {
  href: string;
  children?: ReactNode;
  className?: string;
  replace?: boolean;
  target?: string;
  rel?: string;
  prefetch?: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

/**
 * Next.js-compatible Link shim backed by TanStack Router.
 * Accepts an `href` string (with optional query) and forwards to
 * TanStack's typed Link. Active styling is left to consumer className.
 */
export function Link({
  href,
  children,
  className,
  replace,
  target,
  rel,
  onClick,
  ...rest
}: LinkProps) {
  const [path, search] = splitHref(href);
  const isExternal =
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("mailto:") ||
    path.startsWith("tel:") ||
    target === "_blank";

  if (isExternal) {
    return (
      <a
        href={href}
        className={className}
        target={target}
        rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)}
        onClick={onClick}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <TanstackLink
      to={path}
      search={search ? parseSearch(search) : undefined}
      className={className}
      replace={replace}
      target={target}
      rel={rel}
      onClick={onClick}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </TanstackLink>
  );
}

export default Link;

function splitHref(href: string): [string, string] {
  const idx = href.indexOf("?");
  if (idx === -1) return [href, ""];
  return [href.slice(0, idx), href.slice(idx + 1)];
}

function parseSearch(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}
