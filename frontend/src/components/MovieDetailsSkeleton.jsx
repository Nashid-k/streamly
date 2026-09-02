export default function MovieDetailsSkeleton() {
  return (
    <div
      style={{
        position: "relative",
        marginTop: "-56px",
        paddingTop: 0,
        minHeight: "100vh",
      }}
    >
      {/* ── Backdrop skeleton ────────────────────────────────── */}
      <div
        className="skeleton skeleton-glow"
        style={{
          height: "min(85vh, 900px)",
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          borderRadius: 0,
        }}
      />
      {/* Backdrop gradient overlays */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "100vw", height: "min(85vh, 900px)",
        background: "linear-gradient(to top, #050505 0%, rgba(5,5,5,0.4) 40%, transparent 70%)",
        pointerEvents: "none", zIndex: 1,
      }} />

      {/* ── Topbar skeleton ──────────────────────────────────── */}
      <div
        style={{
          position: "sticky", top: 56, zIndex: 10,
          padding: "0.75rem clamp(1rem, 2.5vw, 2.5rem)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <div className="skeleton" style={{ width: "90px", height: "36px", borderRadius: "8px" }} />
        <div style={{ display: "flex", gap: "8px" }}>
          <div className="skeleton skeleton-circle" style={{ width: "36px", height: "36px" }} />
          <div className="skeleton skeleton-circle" style={{ width: "36px", height: "36px" }} />
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div
        style={{
          position: "relative", zIndex: 2,
          padding: "0 clamp(1rem, 3vw, 3rem)",
          maxWidth: "1600px", margin: "0 auto",
          display: "flex", gap: "2rem", alignItems: "flex-start",
          marginTop: "-30vh",
        }}
      >
        {/* Poster skeleton */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          {/* Poster glow */}
          <div style={{
            position: "absolute", inset: "-15%",
            background: "radial-gradient(circle, rgba(26,26,31,0.8) 0%, transparent 70%)",
            filter: "blur(40px)", zIndex: -1,
          }} />
          <div className="skeleton" style={{ width: "200px", height: "300px", borderRadius: "12px" }} />
        </div>

        {/* Text content skeleton */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem", paddingTop: "1rem" }}>
          {/* LIVE SEASON badge (conditional) */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.5rem" }}>
            <div className="skeleton" style={{ width: "100px", height: "24px", borderRadius: "100px" }} />
            <div className="skeleton" style={{ width: "180px", height: "16px", borderRadius: "4px" }} />
          </div>

          {/* Logo/Title */}
          <div className="skeleton" style={{ width: "min(400px, 70%)", height: "50px", borderRadius: "8px" }} />

          {/* Platform badge */}
          <div className="skeleton" style={{ width: "180px", height: "32px", borderRadius: "8px" }} />

          {/* Meta pills row */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div className="skeleton" style={{ width: "120px", height: "36px", borderRadius: "10px" }} />
            <div className="skeleton" style={{ width: "80px", height: "36px", borderRadius: "8px" }} />
            <div className="skeleton" style={{ width: "90px", height: "36px", borderRadius: "8px" }} />
            <div className="skeleton" style={{ width: "60px", height: "36px", borderRadius: "8px" }} />
            <div className="skeleton" style={{ width: "85px", height: "36px", borderRadius: "8px" }} />
          </div>

          {/* Genre pills */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[90, 70, 100, 60, 80].map((w, i) => (
              <div key={i} className="skeleton" style={{ width: `${w}px`, height: "30px", borderRadius: "100px", animationDelay: `${i * 0.05}s` }} />
            ))}
          </div>

          {/* Description lines */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
            <div className="skeleton" style={{ width: "100%", height: "13px", borderRadius: "4px" }} />
            <div className="skeleton" style={{ width: "95%", height: "13px", borderRadius: "4px" }} />
            <div className="skeleton" style={{ width: "85%", height: "13px", borderRadius: "4px" }} />
            <div className="skeleton" style={{ width: "70%", height: "13px", borderRadius: "4px" }} />
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ width: `${50 + i * 8}px`, height: "22px", borderRadius: "6px", animationDelay: `${i * 0.04}s` }} />
            ))}
          </div>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: "0.85rem", marginTop: "0.75rem" }}>
            <div className="skeleton" style={{ width: "160px", height: "48px", borderRadius: "100px" }} />
            <div className="skeleton" style={{ width: "120px", height: "48px", borderRadius: "100px" }} />
            <div className="skeleton" style={{ width: "48px", height: "48px", borderRadius: "100px" }} />
          </div>
        </div>
      </div>

      {/* ── Episodes section skeleton ───────────────────────── */}
      <div
        style={{
          position: "relative", zIndex: 2,
          padding: "0 clamp(1rem, 2.5vw, 2.5rem)",
          maxWidth: "1600px", margin: "2rem auto 0",
        }}
      >
        {/* Section header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div className="skeleton" style={{ width: "3px", height: "24px", borderRadius: "999px" }} />
            <div className="skeleton" style={{ width: "140px", height: "26px", borderRadius: "6px" }} />
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div className="skeleton" style={{ width: "60px", height: "32px", borderRadius: "8px" }} />
            <div className="skeleton" style={{ width: "140px", height: "32px", borderRadius: "12px" }} />
          </div>
        </div>

        {/* Episode grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: "0.8rem" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
              {/* Episode thumbnail */}
              <div className="skeleton" style={{ width: "100%", aspectRatio: "16/9", borderRadius: 0 }} />
              {/* Episode info */}
              <div style={{ padding: "0.8rem 1rem", display: "flex", gap: "10px" }}>
                {/* Episode number */}
                <div className="skeleton" style={{ height: "28px", width: "32px", borderRadius: "6px", flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  <div className="skeleton" style={{ height: "14px", width: "70%", borderRadius: "4px" }} />
                  <div className="skeleton" style={{ height: "11px", width: "100%", borderRadius: "4px" }} />
                  <div className="skeleton" style={{ height: "11px", width: "80%", borderRadius: "4px" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Similar section skeleton ────────────────────────── */}
      <div
        style={{
          position: "relative", zIndex: 2,
          padding: "0 clamp(1rem, 2.5vw, 2.5rem)",
          maxWidth: "1600px", margin: "2.5rem auto 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <div className="skeleton" style={{ width: "3px", height: "24px", borderRadius: "999px" }} />
          <div className="skeleton" style={{ width: "180px", height: "26px", borderRadius: "6px" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton" style={{ width: "100%", aspectRatio: "2/3", borderRadius: "10px" }} />
              <div className="skeleton" style={{ width: "80%", height: "13px", borderRadius: "4px", marginTop: "8px" }} />
              <div className="skeleton" style={{ width: "50%", height: "11px", borderRadius: "4px", marginTop: "4px" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom spacer */}
      <div style={{ height: "4rem" }} />
    </div>
  );
}
