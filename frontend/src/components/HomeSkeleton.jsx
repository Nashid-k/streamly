export default function HomeSkeleton() {
  return (
    <div style={{ paddingTop: "56px", minHeight: "100vh" }}>
      {/* ── Hero skeleton ─────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          height: "min(85vh, 700px)",
          overflow: "hidden",
          background: "#0a0a0d",
        }}
      >
        <div className="skeleton" style={{ width: "100%", height: "100%" }} />
        {/* Hero content overlay */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "3rem clamp(2rem, 5vw, 4rem)",
            background: "linear-gradient(to top, #050505 0%, transparent 100%)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxWidth: "600px",
          }}
        >
          <div className="skeleton" style={{ width: "350px", height: "60px", borderRadius: "8px" }} />
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div className="skeleton" style={{ width: "120px", height: "42px", borderRadius: "100px" }} />
            <div className="skeleton" style={{ width: "42px", height: "42px", borderRadius: "50%" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div className="skeleton" style={{ width: "100%", height: "14px", borderRadius: "4px" }} />
            <div className="skeleton" style={{ width: "85%", height: "14px", borderRadius: "4px" }} />
            <div className="skeleton" style={{ width: "70%", height: "14px", borderRadius: "4px" }} />
          </div>
        </div>
        {/* Hero navigation dots */}
        <div style={{ position: "absolute", bottom: "2rem", right: "4rem", display: "flex", gap: "6px" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ width: i === 1 ? "40px" : "8px", height: "8px", borderRadius: "100px" }}
            />
          ))}
        </div>
      </div>

      {/* ── Rail skeletons ────────────────────────────────────── */}
      {[1, 2, 3, 4, 5, 6].map((railIdx) => (
        <div
          key={railIdx}
          style={{
            padding: "1.5rem clamp(1rem, 3vw, 3rem)",
            position: "relative",
          }}
        >
          {/* Rail title */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div className="skeleton" style={{ width: `${140 + railIdx * 20}px`, height: "24px", borderRadius: "6px" }} />
            <div className="skeleton" style={{ width: "70px", height: "16px", borderRadius: "4px" }} />
          </div>
          {/* Card row */}
          <div style={{ display: "flex", gap: "0.5rem", overflow: "hidden" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ flexShrink: 0, width: "180px" }}>
                <div className="skeleton" style={{ width: "180px", height: "270px", borderRadius: "10px" }} />
                <div className="skeleton" style={{ width: "70%", height: "14px", borderRadius: "4px", marginTop: "8px" }} />
                <div className="skeleton" style={{ width: "40%", height: "12px", borderRadius: "4px", marginTop: "4px" }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
