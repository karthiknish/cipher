import {
  useNavigate,
  useRouter as useTanstackRouter,
  useParams as useTanstackParams,
} from "@tanstack/react-router";

/**
 * Next.js compatibility shims for navigation hooks.
 * These wrap TanStack Router primitives so existing call sites
 * (`useRouter().push(...)`, `usePathname()`, `useSearchParams()`,
 * `useParams()`) keep working during the migration.
 */

type PushOptions = { replace?: boolean };

export function useRouter() {
  const navigate = useNavigate();
  const router = useTanstackRouter();

  return {
    push: (href: string, opts?: PushOptions) => {
      const [path, search] = splitHref(href);
      navigate({
        to: path,
        search: search ? parseSearch(search) : undefined,
        replace: opts?.replace,
      } as never);
    },
    replace: (href: string) => {
      const [path, search] = splitHref(href);
      navigate({
        to: path,
        search: search ? parseSearch(search) : undefined,
        replace: true,
      } as never);
    },
    refresh: () => router.invalidate(),
    back: () => window.history.back(),
    prefetch: () => {
      /* no-op: TanStack preloads on intent by default */
    },
  };
}

export function usePathname(): string {
  const router = useTanstackRouter();
  return router.state.location.pathname;
}

export function useSearchParams(): URLSearchParams {
  const router = useTanstackRouter();
  return new URLSearchParams(router.state.location.searchStr);
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return useTanstackParams({ strict: false } as never) as T;
}

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
