/**
 * EpisodeSkeleton — realistic skeleton for episode loading states.
 * Supports both 'grid' and 'list' layout modes.
 */
export default function EpisodeSkeleton({ count = 6, layout = "grid" }) {
  if (layout === "list") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="skeleton-card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              background: "transparent",
              border: "1px solid transparent",
            }}
          >
            {/* Thumbnail */}
            <div className="skeleton" style={{ width: "140px", height: "80px", borderRadius: "8px", flexShrink: 0 }} />
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div className="skeleton" style={{ width: "28px", height: "14px", borderRadius: "4px" }} />
                <div className="skeleton" style={{ width: "60%", height: "14px", borderRadius: "4px" }} />
              </div>
              <div className="skeleton" style={{ width: "90%", height: "11px", borderRadius: "4px" }} />
              <div className="skeleton" style={{ width: "70%", height: "11px", borderRadius: "4px" }} />
            </div>
            {/* Duration */}
            <div className="skeleton" style={{ width: "40px", height: "24px", borderRadius: "6px", flexShrink: 0 }} />
          </div>
        ))}
      </div>
    );
  }

  // Grid layout
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: "0.8rem" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton-card"
          style={{
            background: "#0a0a0c",
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {/* Thumbnail with duration badge */}
          <div style={{ position: "relative", aspectRatio: "16/9" }}>
            <div className="skeleton" style={{ width: "100%", height: "100%", borderRadius: 0 }} />
            {/* Duration badge placeholder */}
            <div
              className="skeleton"
              style={{
                position: "absolute", bottom: "8px", right: "8px",
                width: "50px", height: "20px", borderRadius: "5px",
              }}
            />
          </div>
          {/* Episode info */}
          <div style={{ padding: "0.7rem 0.9rem", display: "flex", gap: "10px" }}>
            {/* Episode number */}
            <div className="skeleton" style={{ height: "28px", width: "32px", borderRadius: "6px", flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div className="skeleton" style={{ height: "14px", width: "70%", borderRadius: "4px" }} />
              <div className="skeleton" style={{ height: "11px", width: "100%", borderRadius: "4px" }} />
              <div className="skeleton" style={{ height: "11px", width: "80%", borderRadius: "4px" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
