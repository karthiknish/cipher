import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders children only on the client. During SSR and the first client render,
 * renders `fallback` instead. Use to opt components out of SSR (e.g. TipTap).
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <>{mounted ? children : fallback}</>;
}
