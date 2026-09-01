import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function NotificationPanel({
  notifications,
  onClear,
  isOpen,
  onNavigate,
}) {
  const navigate = useNavigate();
  if (!isOpen) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        position: "absolute",
        top: "120%",
        right: -10,
        background: "rgba(9, 9, 11, 0.95)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "16px",
        boxShadow: "0 30px 60px -12px rgba(0,0,0,1)",
        padding: "8px 0",
        width: "320px",
        zIndex: 200,
        maxHeight: "70vh",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: "4px",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#fff" }}>
          Notifications
        </div>
        {notifications.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClear}
            style={{
              background: "transparent",
              border: "none",
              color: "#a1a1aa",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            Clear All
          </motion.button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div
          style={{
            padding: "2rem 1rem",
            textAlign: "center",
            color: "#a1a1aa",
            fontSize: "0.85rem",
          }}
        >
          You're all caught up!
        </div>
      ) : (
        notifications.map((n) => {
          const diffMs = Date.now() - (n.createdAt || Date.now());
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          let timeStr = "Just now";
          if (diffDays === 1) timeStr = "Yesterday";
          else if (diffDays > 1) timeStr = `${diffDays} days ago`;
          else if (diffMs > 1000 * 60 * 60)
            timeStr = `${Math.floor(diffMs / (1000 * 60 * 60))}h ago`;
          else if (diffMs > 1000 * 60)
            timeStr = `${Math.floor(diffMs / (1000 * 60))}m ago`;
          return (
            <div
              key={n.id}
              onClick={() => {
                if (n.link) {
                  navigate(n.link);
                  onNavigate();
                }
              }}
              style={{
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                cursor: n.link ? "pointer" : "default",
              }}
              onMouseEnter={(e) => {
                if (n.link)
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                if (n.link) e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{ fontSize: "0.9rem", color: "#fff", fontWeight: 500 }}
              >
                {n.title}
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#a1a1aa",
                  lineHeight: 1.4,
                }}
              >
                {n.message}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#71717a",
                  marginTop: "4px",
                }}
              >
                {timeStr}
              </div>
            </div>
          );
        })
      )}
    </motion.div>
  );
}
