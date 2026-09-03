/**
 * AuthModal — Sign In / Sign Up modal powered by Firebase Auth.
 * Shows on clicking the User icon in the navbar.
 *
 * Props:
 *   isOpen  {boolean}  — whether the modal is visible
 *   onClose {function} — close callback
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import Loader from "./Loader";
import { useAppAuth } from "../context/AuthContext";

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panel = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 350, damping: 30 },
  },
  exit: { opacity: 0, y: 20, scale: 0.96, transition: { duration: 0.2 } },
};

export default function AuthModal({ isOpen, onClose }) {
  const { register, login } = useAppAuth();

  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const lastAttemptRef = useRef(0); // Rate limit ref
  const failedAttemptsRef = useRef(0); // Track consecutive failures for progressive backoff
  const successTimerRef = useRef(null);

  // Cleanup success timer on unmount
  useEffect(() => {
    return () => { if (successTimerRef.current) clearTimeout(successTimerRef.current); };
  }, []);

  function resetForm() {
    setEmail("");
    setPass("");
    setName("");
    setError("");
    setSuccess("");
    setBusy(false);
    setShowPw(false);
  }

  function switchMode(m) {
    setMode(m);
    resetForm();
  }

  /** Maps Firebase error codes to readable messages */
  function friendly(err) {
    const code = err?.code ?? "";
    if (code.includes("email-already-in-use"))
      return "An account with this email already exists.";
    if (code.includes("wrong-password"))
      return "Incorrect password. Try again.";
    if (code.includes("user-not-found"))
      return "No account found with that email.";
    if (code.includes("invalid-email"))
      return "Please enter a valid email address.";
    if (code.includes("weak-password"))
      return "Password must be at least 6 characters.";
    if (code.includes("too-many-requests"))
      return "Too many attempts. Please try again later.";
    if (code.includes("network-request-failed"))
      return "Network error. Check your connection.";
    return err?.message ?? "Something went wrong. Please try again.";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    // Rate limit: minimum 1 second between attempts + progressive backoff on failures
    const now = Date.now();
    const minDelay = failedAttemptsRef.current >= 5 ? 5000 : failedAttemptsRef.current >= 3 ? 3000 : 1000;
    if (now - lastAttemptRef.current < minDelay) {
      setError(`Please wait ${Math.ceil((minDelay - (now - lastAttemptRef.current)) / 1000)}s before trying again.`);
      setBusy(false);
      return;
    }
    lastAttemptRef.current = now;
    setBusy(true);
    try {
      if (mode === "register") {
        await register(email.trim(), pass, name.trim());
        failedAttemptsRef.current = 0;
        setSuccess("Account created! Welcome to Streamly 🎉");
        successTimerRef.current = setTimeout(onClose, 1200);
      } else {
        await login(email.trim(), pass);
        failedAttemptsRef.current = 0;
        setSuccess("Signed in successfully!");
        successTimerRef.current = setTimeout(onClose, 800);
      }
    } catch (err) {
      setError(friendly(err));
      failedAttemptsRef.current += 1;
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <motion.div
            className="modal-content"
            variants={panel}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(9,9,11,0.95)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "20px",
              padding: "2rem",
              width: "100%",
              maxWidth: "400px",
              boxShadow: "0 40px 80px -20px rgba(0,0,0,0.9)",
              position: "relative",
            }}
          >
            {/* Close button */}
            <motion.button
              onClick={onClose}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "rgba(255,255,255,0.06)",
                border: "none",
                borderRadius: "8px",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#a1a1aa",
              }}
            >
              <X size={16} />
            </motion.button>

            {/* Logo */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #f97316, #fb923c)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ▶ Streamly
              </div>
              <p
                style={{
                  color: "#71717a",
                  fontSize: "0.85rem",
                  marginTop: "4px",
                }}
              >
                {mode === "login"
                  ? "Sign in to your account"
                  : "Create your account"}
              </p>
            </div>

            {/* Tab switcher */}
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.04)",
                borderRadius: "10px",
                padding: "4px",
                marginBottom: "1.5rem",
              }}
            >
              {["login", "register"].map((m) => (
                <motion.button
                  key={m}
                  onClick={() => switchMode(m)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    transition: "all 0.2s",
                    background:
                      mode === m ? "rgba(249,115,22,0.15)" : "transparent",
                    color: mode === m ? "#fb923c" : "#71717a",
                  }}
                >
                  {m === "login" ? "Sign In" : "Sign Up"}
                </motion.button>
              ))}
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {mode === "register" && (
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>
                    Full Name
                  </span>
                  <div style={{ position: "relative" }}>
                    <User
                      size={16}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#52525b",
                      }}
                    />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      style={inputStyle}
                    />
                  </div>
                </label>
              )}

              <label
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>
                  Email
                </span>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#52525b",
                    }}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={inputStyle}
                  />
                </div>
              </label>

              <label
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>
                  Password
                </span>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#52525b",
                    }}
                  />
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    minLength={mode === "register" ? 6 : undefined}
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder={
                      mode === "register" ? "Min. 6 characters" : "••••••••"
                    }
                    style={inputStyle}
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "#52525b",
                      cursor: "pointer",
                      display: "flex",
                    }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </motion.button>
                </div>
              </label>

              {/* Error / Success messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      background: "rgba(239,68,68,0.12)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      fontSize: "0.83rem",
                      color: "#f87171",
                    }}
                  >
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      background: "rgba(34,197,94,0.12)",
                      border: "1px solid rgba(34,197,94,0.3)",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      fontSize: "0.83rem",
                      color: "#4ade80",
                    }}
                  >
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={busy}
                style={{
                  marginTop: "4px",
                  padding: "12px",
                  background: busy
                    ? "rgba(249,115,22,0.5)"
                    : "linear-gradient(135deg, #f97316, #fb923c)",
                  border: "none",
                  borderRadius: "10px",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  cursor: busy ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "opacity 0.2s",
                }}
              >
                {busy && <Loader variant="button" />}
                {busy
                  ? "Please wait…"
                  : mode === "login"
                    ? "Sign In"
                    : "Create Account"}
              </motion.button>
            </form>

            <p
              style={{
                textAlign: "center",
                color: "#52525b",
                fontSize: "0.78rem",
                marginTop: "1.25rem",
              }}
            >
              {mode === "login"
                ? "Don't have an account? "
                : "Already have an account? "}
              <motion.button
                onClick={() =>
                  switchMode(mode === "login" ? "register" : "login")
                }
                style={{
                  background: "none",
                  border: "none",
                  color: "#fb923c",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  padding: 0,
                }}
              >
                {mode === "login" ? "Sign Up" : "Sign In"}
              </motion.button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  padding: "11px 12px 11px 38px",
  color: "#e4e4e7",
  fontSize: "0.9rem",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};
