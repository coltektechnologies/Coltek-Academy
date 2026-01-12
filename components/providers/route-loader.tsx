"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Loader from "@/components/ui/loader";

/**
 * RouteLoaderProvider
 * Shows a global loading overlay for at least `minDurationMs` when the route changes.
 * This complements app router loading.tsx files by enforcing a minimum display time
 * for a more polished transition.
 */
export function RouteLoaderProvider({
  minDurationMs = 800,
  label = "Loading...",
}: {
  minDurationMs?: number;
  label?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [visible, setVisible] = React.useState(false);
  const startRef = React.useRef<number | null>(null);
  const hideTimeoutRef = React.useRef<number | null>(null);

  // On route change, show loader immediately and hold for at least minDurationMs
  React.useEffect(() => {
    // Clear any previous hide timers
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    startRef.current = Date.now();
    setVisible(true);

    // Schedule hide after minimum duration. We allow the new route to render underneath;
    // the overlay stays on for the minimum time to avoid flicker.
    hideTimeoutRef.current = window.setTimeout(() => {
      setVisible(false);
      hideTimeoutRef.current = null;
    }, minDurationMs);

    // Cleanup on unmount
    return () => {
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  if (!visible) return null;

  return <Loader label={label} />;
}
