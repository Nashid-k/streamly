import { Film, Tv, Clock, Calendar, Star } from "lucide-react";

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
      {/* ── Backdrop skeleton (matches .details-backdrop) ──────── */}
      <div
        className="skeleton"
        style={{
          height: "min(85vh, 900px)",
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          borderRadius: 0,
        }}
      />

      {/* ── Topbar skeleton ────────────────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: 56,
          zIndex: 10,
          padding: "0.75rem clamp(1rem, 2.5vw, 2.5rem)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="skeleton" style={{ width: "90px", height: "36px", borderRadius: "8px" }} />
        <div style={{ display: "flex", gap: "8px" }}>
          <div className="skeleton" style={{ width: "36px", height: "36px", borderRadius: "8px" }} />
          <div className="skeleton" style={{ width: "36px", height: "36px", borderRadius: "8px" }} />
        </div>
      </div>

      {/* ── Main content (matches .details-content-wrapper) ────── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "0 clamp(1rem, 3vw, 3rem)",
          maxWidth: "1600px",
          margin: "0 auto",
          display: "flex",
          gap: "2rem",
          alignItems: "flex-start",
          marginTop: "-30vh",
        }}
      >
        {/* Poster skeleton */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div className="skeleton" style={{ width: "200px", height: "300px", borderRadius: "12px" }} />
        </div>

        {/* Text content skeleton */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem", paddingTop: "1rem" }}>
          {/* Platform badge */}
          <div className="skeleton" style={{ width: "180px", height: "32px", borderRadius: "8px" }} />

          {/* Meta pills row */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* IMDb badge */}
            <div className="skeleton" style={{ width: "120px", height: "34px", borderRadius: "10px" }} />
            {/* Year */}
            <div className="skeleton" style={{ width: "80px", height: "34px", borderRadius: "8px" }} />
            {/* Duration */}
            <div className="skeleton" style={{ width: "90px", height: "34px", borderRadius: "8px" }} />
            {/* Rating */}
            <div className="skeleton" style={{ width: "60px", height: "34px", borderRadius: "8px" }} />
            {/* Match */}
            <div className="skeleton" style={{ width: "85px", height: "34px", borderRadius: "8px" }} />
          </div>

          {/* Genre pills */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[90, 70, 100, 60, 80].map((w, i) => (
              <div key={i} className="skeleton" style={{ width: `${w}px`, height: "30px", borderRadius: "100px" }} />
            ))}
          </div>

          {/* Description lines */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.5rem" }}>
            <div className="skeleton" style={{ width: "100%", height: "14px", borderRadius: "4px" }} />
            <div className="skeleton" style={{ width: "95%", height: "14px", borderRadius: "4px" }} />
            <div className="skeleton" style={{ width: "85%", height: "14px", borderRadius: "4px" }} />
            <div className="skeleton" style={{ width: "70%", height: "14px", borderRadius: "4px" }} />
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ width: `${50 + i * 8}px`, height: "22px", borderRadius: "6px" }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Episodes section skeleton ─────────────────────────── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: "2rem",
          padding: "0 clamp(1rem, 2.5vw, 2.5rem)",
          maxWidth: "1600px",
          margin: "2rem auto 0",
        }}
      >
        {/* Section header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div className="skeleton" style={{ width: "160px", height: "28px", borderRadius: "6px" }} />
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div className="skeleton" style={{ width: "70px", height: "32px", borderRadius: "8px" }} />
            <div className="skeleton" style={{ width: "140px", height: "32px", borderRadius: "12px" }} />
          </div>
        </div>
        {/* Episode grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: "0.8rem" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                background: "#0a0a0c",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div className="skeleton" style={{ width: "100%", aspectRatio: "16/9" }} />
              <div style={{ padding: "0.8rem 1rem", display: "flex", gap: "8px" }}>
                <div className="skeleton" style={{ height: "1.5rem", width: "2rem", borderRadius: "4px" }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div className="skeleton" style={{ height: "1rem", width: "70%", borderRadius: "4px" }} />
                  <div className="skeleton" style={{ height: "0.75rem", width: "100%", borderRadius: "4px" }} />
                  <div className="skeleton" style={{ height: "0.75rem", width: "80%", borderRadius: "4px" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Similar section skeleton ──────────────────────────── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: "2.5rem",
          padding: "0 clamp(1rem, 2.5vw, 2.5rem)",
          maxWidth: "1600px",
          margin: "2.5rem auto 0",
        }}
      >
        <div className="skeleton" style={{ width: "200px", height: "28px", borderRadius: "6px", marginBottom: "1rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <div className="skeleton" style={{ width: "100%", aspectRatio: "2/3", borderRadius: "10px" }} />
              <div className="skeleton" style={{ width: "80%", height: "14px", borderRadius: "4px", marginTop: "8px" }} />
              <div className="skeleton" style={{ width: "50%", height: "12px", borderRadius: "4px", marginTop: "4px" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
