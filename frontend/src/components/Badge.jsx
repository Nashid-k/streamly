import { motion } from "framer-motion";

const VARIANTS = {
  accent: "badge-accent",
  orange: "badge-orange",
  success: "badge-success",
  muted: "badge-muted",
};

export default function Badge({
  children,
  variant = "muted",
  pulse = false,
  style: overrideStyle,
}) {
  return (
    <motion.span
      className={`badge ${VARIANTS[variant] || VARIANTS.muted}`}
      style={overrideStyle}
      whileHover={{ scale: 1.05 }}
    >
      {pulse && (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "currentColor",
            animation: "pulse 2s ease-in-out infinite",
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </motion.span>
  );
}
