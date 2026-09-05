import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ToastProvider } from "./components/Toast.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { queryClient } from "./queryClient";
import { startServerHealthMonitor, apiHealthUrl } from "./api/serverHealth";

// Pre-warm the backend on boot — fire a lightweight HEAD-style request so a
// sleeping Render/Vercel instance starts waking before the user navigates.
// Runs in parallel with the health monitor's own probe.
const prewarmBackend = () => {
  if (import.meta.env.PROD) {
    // Use no-cors to avoid CORS errors on cross-origin backends; we only care
    // that the request leaves the browser (waking the server), not the response.
    fetch(apiHealthUrl(), { mode: "no-cors", priority: "low", cache: "no-store" }).catch(() => {});
  }
};

prewarmBackend();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Register SW with build timestamp for cache busting on deploys
      const buildTime = typeof __BUILD_TIME !== 'undefined' ? __BUILD_TIME : Date.now();
      const reg = await navigator.serviceWorker.register(`/sw.js?v=${buildTime}`);
      // Check for updates periodically (SW will activate when new version found).
      // Skip the network round-trip while the tab is hidden to avoid waking
      // the SW / burning background data every minute.
      setInterval(() => {
        if (document.visibilityState !== 'visible') return;
        reg.update().catch(() => {});
      }, 60000);
      // Also nudge a check right when the tab becomes visible again, so a
      // fresh deploy is picked up promptly without background polling.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    } catch {}
  });
}

// Backend health monitor: pre-warms a sleeping API/stream service shortly
// after boot and keeps probing with backoff while they're down (see
// api/serverHealth.js). When they come back healthy, dismiss the wakeup
// banner — the request-level interceptor may have raised it during the cold
// start even though the first requests eventually succeeded.
startServerHealthMonitor({
  onHealthy: () => {
    window.dispatchEvent(new Event("server-wakeup-done"));
  },
});
