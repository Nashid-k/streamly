import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ToastProvider } from "./components/Toast.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Unregister ALL old service workers first (aggressive cleanup)
    navigator.serviceWorker.getRegistrations().then((regs) => {
      const oldRegs = regs.filter((r) => r.active && r.active.scriptURL.includes('/sw.js'));
      // If there's already an active SW, check if it's stale
      if (oldRegs.length > 0) {
        const active = oldRegs[0].active;
        if (active) {
          active.postMessage({ type: 'CHECK_VERSION' });
        }
      }
    }).catch(() => {});

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      // Check for SW updates every 15 seconds (faster detection)
      const checkUpdate = () => reg.update().catch(() => {});
      setInterval(checkUpdate, 15000);
      // When new SW takes over, reload the page
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "activated" && navigator.serviceWorker.controller) {
              // Clear React Query cache before reload
              try { queryClient.clear(); } catch {}
              window.location.reload();
            }
          });
        }
      });
    }).catch(console.warn);
  });
}
