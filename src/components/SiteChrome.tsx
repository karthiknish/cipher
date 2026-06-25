import { usePathname } from "@/lib/navigation";
import Chatbot from "@/components/Chatbot";
import ActivityTicker from "@/components/ActivityTicker";
import SpinWheel from "@/components/SpinWheel";

/** Paths where floating widgets are hidden to reduce distraction. */
const MINIMAL_CHROME_PATHS = ["/checkout", "/login"];

export function SiteChrome() {
  const pathname = usePathname();
  const minimal = MINIMAL_CHROME_PATHS.some((p) => pathname.startsWith(p));

  if (minimal) return null;

  return (
    <>
      <Chatbot />
      <ActivityTicker />
      <SpinWheel />
    </>
  );
}
