import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, AlertCircle, Info } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: <Check size={16} />,
  error: <AlertCircle size={16} />,
  info: <Info size={16} />,
};

const COLORS = {
  success: {
    bg: "rgba(16, 185, 129, 0.15)",
    border: "rgba(16, 185, 129, 0.4)",
    icon: "#10b981",
  },
  error: {
    bg: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.4)",
    icon: "#ef4444",
  },
  info: {
    bg: "rgba(255, 255, 255, 0.08)",
    border: "rgba(255, 255, 255, 0.15)",
    icon: "#a1a1aa",
  },
};

function ToastItem({ toast, onDismiss }) {
  const colors = COLORS[toast.type] || COLORS.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 60, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.22 } }}
      transition={{ type: "spring", stiffness: 450, damping: 30 }}
      onClick={() => onDismiss(toast.id)}
      className={`toast-item toast-${toast.type || "info"}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 16px",
        borderRadius: "14px",
        background: "rgba(9, 9, 11, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${colors.border}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        minWidth: "260px",
        maxWidth: "380px",
        cursor: "pointer",
        userSelect: "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle tinted left accent bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "3px",
          background: colors.icon,
          borderRadius: "14px 0 0 14px",
        }}
      />

      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: colors.icon,
          marginLeft: "4px",
        }}
      >
        {ICONS[toast.type]}
      </div>

      <div style={{ flex: 1 }}>
        {toast.title && (
          <div
            style={{
              fontWeight: 700,
              fontSize: "0.88rem",
              color: "#fff",
              marginBottom: toast.message ? "2px" : 0,
            }}
          >
            {toast.title}
          </div>
        )}
        {toast.message && (
          <div
            style={{ fontSize: "0.82rem", color: "#a1a1aa", lineHeight: 1.4 }}
          >
            {toast.message}
          </div>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(toast.id);
        }}
        style={{
          background: "transparent",
          border: "none",
          color: "#52525b",
          cursor: "pointer",
          padding: "2px",
          display: "flex",
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, message, type = "info", duration = 3000 }) => {
      const id = ++counterRef.current;
      setToasts((prev) => [...prev.slice(-4), { id, title, message, type }]); // keep max 5
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast container — fixed bottom-center, above mobile nav */}
      <div
        style={{
          position: "fixed",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 90px)",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column-reverse",
          alignItems: "center",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} style={{ pointerEvents: "auto" }}>
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
