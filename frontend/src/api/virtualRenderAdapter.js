import { useState, useEffect, useRef } from "react";

/**
 * An adapter hook that defers rendering of heavy components (like 3D effects, iframes, or large DOM trees)
 * until they are actually visible on screen.
 */
export function useVirtualRenderAdapter(rootMargin = "200px") {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // If the browser doesn't support IntersectionObserver, fail gracefully to full render
    if (!window.IntersectionObserver) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once it becomes visible, we can disconnect to keep it rendered (or toggle for strict virtualization)
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [rootMargin]);

  return { isVisible, ref };
}
