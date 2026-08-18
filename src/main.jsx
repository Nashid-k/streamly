import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const originalFetch = window.fetch;
window.fetch = async function(...args) {
  let timeoutId = setTimeout(() => {
    window.dispatchEvent(new Event('server-wakeup'));
  }, 5000);

  try {
    const response = await originalFetch.apply(this, args);
    clearTimeout(timeoutId);
    window.dispatchEvent(new Event('server-wakeup-done'));
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    window.dispatchEvent(new Event('server-wakeup-done'));
    throw err;
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
