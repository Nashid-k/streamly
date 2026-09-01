import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Bookmark, Clock, Keyboard, LogOut } from "lucide-react";

export default function UserMenu({ user, isOpen, onClose, onLogout }) {
  if (!isOpen || !user) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        position: "absolute",
        top: "120%",
        right: 0,
        background: "rgba(9, 9, 11, 0.95)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "16px",
        boxShadow: "0 30px 60px -12px rgba(0,0,0,1)",
        padding: "8px 0",
        minWidth: "200px",
        zIndex: 200,
      }}
    >
      <div
        style={{
          padding: "10px 16px 8px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: "4px",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#fff" }}>
          {user.displayName || "Streamer"}
        </div>
        <div
          style={{
            fontSize: "0.75rem",
            color: "#71717a",
            marginTop: "2px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user.email}
        </div>
      </div>
      {[
        { to: "/mylist", icon: <Bookmark size={16} />, label: "My List" },
        { to: "/history", icon: <Clock size={16} />, label: "Watch History" },
      ].map(({ to, icon, label }) => (
        <Link
          key={to}
          to={to}
          onClick={onClose}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 16px",
            fontSize: "0.9rem",
            color: "#e4e4e7",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          {icon} {label}
        </Link>
      ))}
      <div
        style={{
          height: "1px",
          background: "rgba(255,255,255,0.08)",
          margin: "4px 0",
        }}
      />
      <div
        onClick={() => {
          onClose();
          window.dispatchEvent(
            new KeyboardEvent("keydown", { key: "?", shiftKey: true }),
          );
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 16px",
          fontSize: "0.9rem",
          color: "#e4e4e7",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <Keyboard size={16} /> Keyboard Shortcuts
      </div>
      <div
        style={{
          height: "1px",
          background: "rgba(255,255,255,0.08)",
          margin: "4px 0",
        }}
      />
      <div
        onClick={onLogout}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 16px",
          fontSize: "0.9rem",
          color: "#f87171",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(239,68,68,0.08)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <LogOut size={16} /> Sign Out
      </div>
    </motion.div>
  );
}
