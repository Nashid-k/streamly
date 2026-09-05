import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronDown, Shield, Settings } from "lucide-react";

// Content warning categories with severity levels
const WARNING_CATEGORIES = {
  violence: { label: "Violence", icon: "⚔️", severity: ["mild", "moderate", "strong", "graphic"] },
  language: { label: "Language", icon: "💬", severity: ["mild", "moderate", "strong"] },
  sexual: { label: "Sexual Content", icon: "❤️", severity: ["mild", "moderate", "strong", "explicit"] },
  substances: { label: "Substances", icon: "🍺", severity: ["mild", "moderate", "strong"] },
  fear: { label: "Fear/Horror", icon: "👻", severity: ["mild", "moderate", "strong", "extreme"] },
  discrimination: { label: "Discrimination", icon: "⚖️", severity: ["mild", "moderate", "strong"] },
  self_harm: { label: "Self-Harm", icon: "💔", severity: ["mild", "moderate", "strong"] },
  themes: { label: "Sensitive Themes", icon: "🎭", severity: ["mild", "moderate", "strong"] },
};

// Severity color mapping
const SEVERITY_COLORS = {
  mild: { bg: "rgba(74,222,128,0.08)", text: "#4ade80", border: "rgba(74,222,128,0.2)" },
  moderate: { bg: "rgba(251,191,36,0.08)", text: "#fbbf24", border: "rgba(251,191,36,0.2)" },
  strong: { bg: "rgba(249,115,22,0.08)", text: "#f97316", border: "rgba(249,115,22,0.2)" },
  graphic: { bg: "rgba(239,68,68,0.08)", text: "#ef4444", border: "rgba(239,68,68,0.2)" },
  explicit: { bg: "rgba(239,68,68,0.08)", text: "#ef4444", border: "rgba(239,68,68,0.2)" },
  extreme: { bg: "rgba(239,68,68,0.08)", text: "#ef4444", border: "rgba(239,68,68,0.2)" },
};

function getSeverityStyle(severity) {
  return SEVERITY_COLORS[severity] || SEVERITY_COLORS.mild;
}

/**
 * ContentWarnings — Expanded content advisory with detailed breakdown
 *
 * Shows categorized content warnings with severity levels,
 * expandable details, and user-configurable sensitivity.
 */
export default function ContentWarnings({ warnings = [], contentRating, maturityRating }) {
  const [expanded, setExpanded] = useState(false);
  const [sensitivity, setSensitivity] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("streamly_sensitivity") || "{}");
    } catch {
      return {};
    }
  });

  // Save sensitivity preferences
  useEffect(() => {
    try {
      localStorage.setItem("streamly_sensitivity", JSON.stringify(sensitivity));
    } catch {}
  }, [sensitivity]);

  // Parse warnings into structured format
  const parsedWarnings = warnings.map(w => {
    const text = typeof w === "string" ? w : w.text || w.label || "";
    const severity = typeof w === "object" ? w.severity || "moderate" : "moderate";
    const category = typeof w === "object" ? w.category || null : null;

    // Auto-detect category from text
    const detectedCategory = category || Object.keys(WARNING_CATEGORIES).find(cat => {
      const catInfo = WARNING_CATEGORIES[cat];
      return text.toLowerCase().includes(catInfo.label.toLowerCase()) ||
             text.toLowerCase().includes(cat);
    });

    return {
      text,
      severity,
      category: detectedCategory,
      categoryInfo: detectedCategory ? WARNING_CATEGORIES[detectedCategory] : null,
    };
  });

  // Group by category
  const groupedWarnings = {};
  for (const w of parsedWarnings) {
    const key = w.category || "other";
    if (!groupedWarnings[key]) groupedWarnings[key] = [];
    groupedWarnings[key].push(w);
  }

  const hasContent = parsedWarnings.length > 0 || contentRating || maturityRating;

  if (!hasContent) return null;

  // Determine overall severity
  const severityOrder = ["mild", "moderate", "strong", "graphic", "explicit", "extreme"];
  const maxSeverity = parsedWarnings.reduce((max, w) => {
    const idx = severityOrder.indexOf(w.severity);
    return idx > severityOrder.indexOf(max) ? w.severity : max;
  }, "mild");

  const overallStyle = getSeverityStyle(maxSeverity);

  return (
    <div style={{
      borderRadius: "12px",
      border: `1px solid ${overallStyle.border}`,
      overflow: "hidden",
    }}>
      {/* Header */}
      <motion.button
        onClick={() => setExpanded(!expanded)}
        whileHover={{ background: "rgba(255,255,255,0.04)" }}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "10px",
          padding: "12px 14px", background: overallStyle.bg,
          border: "none", cursor: "pointer",
        }}
      >
        <div style={{
          width: "28px", height: "28px", borderRadius: "8px",
          background: overallStyle.border,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Shield size={14} color={overallStyle.text} />
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e4e4e7" }}>
            Content Advisory
          </div>
          <div style={{ fontSize: "0.7rem", color: "#a1a1aa", marginTop: "1px" }}>
            {parsedWarnings.length} warning{parsedWarnings.length !== 1 ? "s" : ""}
            {contentRating && ` · Rated ${contentRating}`}
            {maturityRating && ` · ${maturityRating}`}
          </div>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} color="#71717a" />
        </motion.div>
      </motion.button>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Rating Badges */}
              {(contentRating || maturityRating) && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {contentRating && (
                    <div style={{
                      padding: "4px 10px", borderRadius: "6px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontSize: "0.75rem", fontWeight: 700, color: "#e4e4e7",
                    }}>
                      {contentRating}
                    </div>
                  )}
                  {maturityRating && (
                    <div style={{
                      padding: "4px 10px", borderRadius: "6px",
                      background: overallStyle.bg,
                      border: `1px solid ${overallStyle.border}`,
                      fontSize: "0.75rem", fontWeight: 700, color: overallStyle.text,
                    }}>
                      {maturityRating}
                    </div>
                  )}
                </div>
              )}

              {/* Grouped Warnings */}
              {Object.entries(groupedWarnings).map(([cat, items]) => {
                const catInfo = WARNING_CATEGORIES[cat];
                return (
                  <div key={cat}>
                    <div style={{
                      fontSize: "0.7rem", fontWeight: 700, color: "#52525b",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px",
                    }}>
                      {catInfo?.icon && <span>{catInfo.icon}</span>}
                      {catInfo?.label || "Other"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {items.map((w, i) => {
                        const sevStyle = getSeverityStyle(w.severity);
                        return (
                          <div key={i} style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "6px 10px", borderRadius: "6px",
                            background: sevStyle.bg,
                            border: `1px solid ${sevStyle.border}`,
                          }}>
                            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: sevStyle.text, textTransform: "capitalize" }}>
                              {w.severity}
                            </span>
                            <span style={{ fontSize: "0.78rem", color: "#d4d4d8", flex: 1 }}>
                              {w.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Sensitivity Settings */}
              <div style={{
                padding: "10px", borderRadius: "8px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{
                  fontSize: "0.7rem", fontWeight: 700, color: "#52525b",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px",
                }}>
                  <Settings size={10} /> Sensitivity Settings
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {Object.entries(WARNING_CATEGORIES).map(([key, cat]) => {
                    const isActive = sensitivity[key] !== false;
                    return (
                      <motion.button
                        key={key}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSensitivity(prev => ({ ...prev, [key]: !isActive }))}
                        style={{
                          display: "flex", alignItems: "center", gap: "4px",
                          padding: "4px 8px", borderRadius: "100px",
                          background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                          border: `1px solid ${isActive ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
                          color: isActive ? "#e4e4e7" : "#52525b",
                          fontSize: "0.65rem", fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        <span>{cat.icon}</span>
                        {cat.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
