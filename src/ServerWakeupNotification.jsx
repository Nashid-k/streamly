import React, { useEffect, useState } from 'react';

export function ServerWakeupNotification() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleWakeup = () => setShow(true);
    const handleDone = () => setShow(false);

    window.addEventListener('server-wakeup', handleWakeup);
    window.addEventListener('server-wakeup-done', handleDone);

    return () => {
      window.removeEventListener('server-wakeup', handleWakeup);
      window.removeEventListener('server-wakeup-done', handleDone);
    };
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '24px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      fontFamily: 'sans-serif',
      fontSize: '14px',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div className="spinner" style={{
        width: '16px',
        height: '16px',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTop: '2px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      Waking up the server, this might take a moment...
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}} />
    </div>
  );
}
