import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

/**
 * Reusable confirm dialog — replaces window.confirm().
 * Usage:
 *   const { confirmDialog, ConfirmDialogRenderer } = useConfirmDialog();
 *   // In JSX: <ConfirmDialogRenderer />
 *   // Trigger: await confirmDialog({ title, message, confirmLabel?, cancelLabel? })
 */
export function useConfirmDialog() {
  const [dialog, setDialog] = useState(null); // { title, message, confirmLabel, cancelLabel, resolve }

  const confirmDialog = (opts) =>
    new Promise((resolve) => {
      setDialog({ ...opts, resolve });
    });

  const handleConfirm = () => {
    dialog?.resolve(true);
    setDialog(null);
  };

  const handleCancel = () => {
    dialog?.resolve(false);
    setDialog(null);
  };

  function ConfirmDialogRenderer() {
    return (
      <AnimatePresence>
        {dialog && (
          <>
            {/* Backdrop */}
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(4px)",
                zIndex: 10000,
              }}
            />
            {/* Modal */}
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 10001,
                background: "rgba(18, 18, 20, 0.97)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "20px",
                padding: "2rem",
                width: "90%",
                maxWidth: "380px",
                boxShadow:
                  "0 32px 64px -12px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ef4444",
                }}
              >
                <AlertTriangle size={22} />
              </div>

              <div>
                <h3
                  style={{
                    margin: "0 0 6px",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {dialog.title || "Are you sure?"}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.9rem",
                    color: "#a1a1aa",
                    lineHeight: 1.5,
                  }}
                >
                  {dialog.message}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={handleCancel}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#e4e4e7",
                    padding: "10px 20px",
                    borderRadius: "100px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.12)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.06)")
                  }
                >
                  {dialog.cancelLabel || "Cancel"}
                </button>
                <button
                  onClick={handleConfirm}
                  style={{
                    background: "#ef4444",
                    border: "1px solid #ef4444",
                    color: "#fff",
                    padding: "10px 20px",
                    borderRadius: "100px",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 14px rgba(239,68,68,0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#dc2626";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#ef4444";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {dialog.confirmLabel || "Confirm"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return { confirmDialog, ConfirmDialogRenderer };
}
