import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

let inflightCount = 0;
let wakeupTimer = null;
let wakeupFired = false;

const originalFetch = window.fetch;
window.fetch = async function(...args) {
  inflightCount++;

  // Only start the wakeup timer if nothing is already inflight (first request)
  if (inflightCount === 1 && !wakeupFired) {
    wakeupTimer = setTimeout(() => {
      wakeupFired = true;
      window.dispatchEvent(new Event('server-wakeup'));
    }, 5000);
  }

  try {
    const response = await originalFetch.apply(this, args);
    return response;
  } catch (err) {
    throw err;
  } finally {
    inflightCount = Math.max(0, inflightCount - 1);
    if (inflightCount === 0) {
      clearTimeout(wakeupTimer);
      wakeupTimer = null;
      if (wakeupFired) {
        wakeupFired = false;
        window.dispatchEvent(new Event('server-wakeup-done'));
      }
    }
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
