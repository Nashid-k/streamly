import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const MAX_SCROLL_ENTRIES = 20;

/**
 * Clean up old scroll entries to prevent sessionStorage from growing
 * indefinitely. Keeps only the most recent MAX_SCROLL_ENTRIES entries.
 */
function pruneScrollEntries(currentKey) {
  try {
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith('scroll-')) keys.push(k);
    }
    if (keys.length > MAX_SCROLL_ENTRIES) {
      // Sort by least recently accessed (oldest first)
      keys.sort((a, b) => {
        const aVal = sessionStorage.getItem(a);
        const bVal = sessionStorage.getItem(b);
        // Use value as a rough proxy — entries with smaller scroll positions
        // are likely from shorter/older page visits
        return parseInt(aVal || '0') - parseInt(bVal || '0');
      });
      // Remove oldest entries, but always keep the current page's entry
      const toRemove = keys.slice(0, keys.length - MAX_SCROLL_ENTRIES);
      for (const k of toRemove) {
        if (k !== `scroll-${currentKey}`) {
          sessionStorage.removeItem(k);
        }
      }
    }
  } catch {}
}

export function useScrollRestoration() {
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(
        `scroll-${location.key}`,
        window.scrollY.toString(),
      );
    };

    // Save scroll periodically
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      // Prune old entries when leaving a page
      pruneScrollEntries(location.key);
    };
  }, [location.key]);

  useEffect(() => {
    if (navType === "POP") {
      const savedPosition = sessionStorage.getItem(`scroll-${location.key}`);
      if (savedPosition) {
        const scrollY = parseInt(savedPosition, 10);
        // Attempt immediate restore
        window.scrollTo(0, scrollY);
        // Fallback restore for when React renders children or Suspense resolves
        const timeoutId = setTimeout(() => window.scrollTo(0, scrollY), 100);
        return () => clearTimeout(timeoutId);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.key, navType]);
}
