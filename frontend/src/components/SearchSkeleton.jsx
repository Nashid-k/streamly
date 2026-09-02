/**
 * SearchSkeleton — skeleton for search results loading state.
 * Shows a grid of movie cards matching the search results layout.
 */
export default function SearchSkeleton({ count = 12 }) {
  return (
    <div style={{ padding: "clamp(1rem, 3vw, 3rem)", paddingTop: "calc(56px + 1.5rem)" }}>
      {/* Search header skeleton */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="skeleton" style={{ width: "200px", height: "28px", borderRadius: "6px", marginBottom: "0.75rem" }} />
        <div className="skeleton" style={{ width: "300px", height: "16px", borderRadius: "4px" }} />
      </div>

      {/* Results grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 170px), 1fr))", gap: "1rem" }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-card">
            {/* Poster */}
            <div className="skeleton" style={{ width: "100%", aspectRatio: "2/3", borderRadius: "10px" }} />
            {/* Title */}
            <div className="skeleton" style={{ width: `${60 + (i % 4) * 8}%`, height: "14px", borderRadius: "4px", marginTop: "10px" }} />
            {/* Year + Rating */}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "6px" }}>
              <div className="skeleton" style={{ width: "50px", height: "11px", borderRadius: "4px" }} />
              <div className="skeleton" style={{ width: "35px", height: "11px", borderRadius: "4px" }} />
            </div>
            {/* Genre pills */}
            <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
              <div className="skeleton" style={{ width: "60px", height: "18px", borderRadius: "100px" }} />
              <div className="skeleton" style={{ width: "45px", height: "18px", borderRadius: "100px" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
