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
        {/* Backdrop shimmer */}
        <div className="skeleton skeleton-glow" style={{ width: "100%", height: "100%", borderRadius: 0 }} />

        {/* Gradient overlays */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, #050505 0%, rgba(5,5,5,0.6) 30%, transparent 60%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, rgba(5,5,5,0.8) 0%, transparent 40%)",
          pointerEvents: "none",
        }} />

        {/* Hero content overlay */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "3rem clamp(2rem, 5vw, 4rem)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxWidth: "600px",
          }}
        >
          {/* Logo/Title */}
          <div className="skeleton" style={{ width: "min(350px, 80%)", height: "55px", borderRadius: "8px", animationDelay: "0.1s" }} />

          {/* Meta pills */}
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <div className="skeleton" style={{ width: "100px", height: "32px", borderRadius: "100px", animationDelay: "0.15s" }} />
            <div className="skeleton" style={{ width: "70px", height: "32px", borderRadius: "8px", animationDelay: "0.2s" }} />
            <div className="skeleton" style={{ width: "80px", height: "32px", borderRadius: "8px", animationDelay: "0.25s" }} />
            <div className="skeleton" style={{ width: "65px", height: "32px", borderRadius: "8px", animationDelay: "0.3s" }} />
          </div>

          {/* Description lines */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginTop: "0.25rem" }}>
            <div className="skeleton" style={{ width: "100%", height: "12px", borderRadius: "4px", animationDelay: "0.35s" }} />
            <div className="skeleton" style={{ width: "90%", height: "12px", borderRadius: "4px", animationDelay: "0.4s" }} />
            <div className="skeleton" style={{ width: "75%", height: "12px", borderRadius: "4px", animationDelay: "0.45s" }} />
          </div>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <div className="skeleton" style={{ width: "140px", height: "46px", borderRadius: "100px", animationDelay: "0.5s" }} />
            <div className="skeleton" style={{ width: "46px", height: "46px", borderRadius: "50%", animationDelay: "0.55s" }} />
            <div className="skeleton" style={{ width: "46px", height: "46px", borderRadius: "50%", animationDelay: "0.6s" }} />
          </div>
        </div>

        {/* Hero navigation dots */}
        <div style={{ position: "absolute", bottom: "2rem", right: "4rem", display: "flex", gap: "6px" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                width: i === 1 ? "40px" : "8px",
                height: "8px",
                borderRadius: "100px",
                animationDelay: `${0.6 + i * 0.05}s`,
              }}
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
          {/* Rail header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {/* Section accent bar */}
              <div className="skeleton" style={{ width: "3px", height: "22px", borderRadius: "999px", animationDelay: `${railIdx * 0.1}s` }} />
              <div className="skeleton" style={{ width: `${130 + railIdx * 25}px`, height: "22px", borderRadius: "6px", animationDelay: `${railIdx * 0.1 + 0.05}s` }} />
            </div>
            <div className="skeleton" style={{ width: "65px", height: "14px", borderRadius: "4px", animationDelay: `${railIdx * 0.1 + 0.1}s` }} />
          </div>

          {/* Card row with proper sizing */}
          <div style={{ display: "flex", gap: "0.6rem", overflow: "hidden" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-card" style={{ flexShrink: 0, width: "170px" }}>
                {/* Poster */}
                <div className="skeleton" style={{
                  width: "170px",
                  height: "255px",
                  borderRadius: "10px",
                  animationDelay: `${railIdx * 0.1 + i * 0.04}s`,
                }} />
                {/* Title */}
                <div className="skeleton" style={{
                  width: `${60 + (i % 4) * 10}%`,
                  height: "13px",
                  borderRadius: "4px",
                  marginTop: "8px",
                  animationDelay: `${railIdx * 0.1 + i * 0.04 + 0.1}s`,
                }} />
                {/* Subtitle */}
                <div className="skeleton" style={{
                  width: `${35 + (i % 3) * 8}%`,
                  height: "11px",
                  borderRadius: "4px",
                  marginTop: "4px",
                  animationDelay: `${railIdx * 0.1 + i * 0.04 + 0.15}s`,
                }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
