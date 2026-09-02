import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const apiClient = axios.create({
  baseURL: API_URL,
});

let inflightCount = 0;
let wakeupTimer = null;
let wakeupFired = false;

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    inflightCount++;

    if (inflightCount === 1 && !wakeupFired) {
      wakeupTimer = setTimeout(() => {
        wakeupFired = true;
        window.dispatchEvent(new Event("server-wakeup"));
      }, 5000);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    decrementInflight();
    return response;
  },
  (error) => {
    decrementInflight();
    return Promise.reject(error);
  },
);

function decrementInflight() {
  inflightCount = Math.max(0, inflightCount - 1);
  if (inflightCount === 0) {
    if (wakeupTimer) {
      clearTimeout(wakeupTimer);
      wakeupTimer = null;
    }
    // Only dispatch wakeup-done if wakeup was actually dispatched,
    // and only if we haven't already dispatched it for this cycle.
    // This prevents the race where a slow response arrives after
    // the wakeup timer fires — we still need to clean up properly.
    if (wakeupFired) {
      wakeupFired = false;
      window.dispatchEvent(new Event("server-wakeup-done"));
    }
  }
}
