import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

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
