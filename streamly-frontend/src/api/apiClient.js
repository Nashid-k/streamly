import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export const apiClient = axios.create({
  baseURL: API_URL,
});

let inflightCount = 0;
let wakeupTimer = null;
let wakeupFired = false;
let wakeupSafetyTimer = null;

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    inflightCount++;

    if (inflightCount === 1 && !wakeupFired) {
      wakeupTimer = setTimeout(() => {
        wakeupFired = true;
        window.dispatchEvent(new Event("server-wakeup"));
        // Safety: reset wakeupFired after 30s so it can fire again
        // even if inflightCount never reaches 0 (e.g. error leak)
        wakeupSafetyTimer = setTimeout(() => { wakeupFired = false; }, 30000);
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
    if (wakeupSafetyTimer) {
      clearTimeout(wakeupSafetyTimer);
      wakeupSafetyTimer = null;
    }
    if (wakeupFired) {
      wakeupFired = false;
      window.dispatchEvent(new Event("server-wakeup-done"));
    }
  }
}
