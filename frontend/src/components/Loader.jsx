import React, { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";

/**
 * Universal 100x GPU-Accelerated Loader Adapter
 * Replaces all disparate loaders (progress bars, lucide icons, etc.) with a single,
 * mathematically perfect CSS spinner that scales dynamically to any context.
 *
 * Variants:
 * - 'page': Massive centered spinner for page-blocking loads (Suspense, Initial Data)
 * - 'inline': Container-bound spinner for sections
 * - 'button': Tiny 16px spinner for buttons (AuthModal)
 * - 'global': Smart, non-blocking spinner fixed in the bottom-right corner that
 *             automatically tracks all background data fetches without UI locking.
 */
export default function Loader({ variant = "page", size }) {
  // Global background tracking logic
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isGlobalLoading = isFetching > 0 || isMutating > 0;

  const [showGlobal, setShowGlobal] = useState(false);

  // Debounce global loader to prevent flickering on 50ms fast requests
  useEffect(() => {
    if (variant !== "global") return;

    let timer;
    if (isGlobalLoading) {
      timer = setTimeout(() => setShowGlobal(true), 300); // 300ms grace period
    } else {
      setShowGlobal(false);
    }
    return () => clearTimeout(timer);
  }, [isGlobalLoading, variant]);

  if (variant === "global" && !showGlobal) return null;

  // Compute CSS sizing dynamically
  let dimensions = "60px";
  if (size) dimensions = size;
  else if (variant === "button") dimensions = "18px";
  else if (variant === "global") dimensions = "32px";

  const spinnerCore = (
    <div
      style={{ position: "relative", width: dimensions, height: dimensions }}
    >
      <style>
        {`
          .spinner-outer, .spinner-inner {
            position: absolute;
            border-radius: 50%;
            will-change: transform;
          }
          .spinner-outer {
            inset: 0;
            border: calc(${dimensions} * 0.05) solid rgba(229, 9, 20, 0.15);
            border-top-color: #e50914;
            border-right-color: #e50914;
            animation: spin-right 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
          }
          .spinner-inner {
            inset: calc(${dimensions} * 0.15);
            border: calc(${dimensions} * 0.05) solid rgba(251, 146, 60, 0.15);
            border-bottom-color: #fb923c;
            border-left-color: #fb923c;
            animation: spin-left 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
          }
          .spinner-dot {
            position: absolute;
            inset: calc(${dimensions} * 0.35);
            background-color: #e50914;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(229, 9, 20, 0.8);
            animation: pulse-dot 1.2s ease-in-out infinite;
            will-change: transform, opacity;
          }

          @keyframes spin-right { to { transform: rotate(360deg); } }
          @keyframes spin-left { to { transform: rotate(-360deg); } }
          @keyframes pulse-dot {
            0%, 100% { transform: scale(0.8); opacity: 0.5; }
            50% { transform: scale(1.2); opacity: 1; }
          }
        `}
      </style>
      <div className="spinner-outer" />
      <div className="spinner-inner" />
      <div className="spinner-dot" />
    </div>
  );

  // Render context
  if (variant === "button") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {spinnerCore}
      </div>
    );
  }

  if (variant === "global") {
    return (
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 999999,
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(10px)",
          padding: "12px",
          borderRadius: "50%",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          pointerEvents: "none",
          animation: "fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <style>{`@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        {spinnerCore}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: variant === "page" ? "70vh" : "auto",
        width: "100%",
        padding: variant === "inline" ? "2rem" : "0",
        background: "transparent",
      }}
    >
      {spinnerCore}
    </div>
  );
}
