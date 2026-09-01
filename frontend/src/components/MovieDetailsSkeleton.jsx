export default function MovieDetailsSkeleton() {
  return (
    <div
      style={{
        position: "relative",
        marginTop: "-2rem",
        paddingTop: "2rem",
        minHeight: "100vh",
      }}
    >
      {/* Backdrop skeleton */}
      <div
        className="skeleton"
        style={{
          height: "92vh",
          position: "absolute",
          top: 0,
          left: "-3rem",
          width: "calc(100% + 6rem)",
          marginTop: "-2rem",
        }}
      />

      <div style={{ position: "relative", zIndex: 10, padding: "2rem 3rem" }}>
        {/* Back button skeleton */}
        <div
          className="skeleton"
          style={{
            width: "80px",
            height: "40px",
            borderRadius: "100px",
            marginBottom: "2rem",
          }}
        />

        <div
          style={{
            display: "flex",
            gap: "2rem",
            alignItems: "flex-end",
            marginTop: "30vh",
          }}
        >
          {/* Poster skeleton */}
          <div
            className="skeleton"
            style={{
              width: "200px",
              height: "300px",
              borderRadius: "12px",
              flexShrink: 0,
            }}
          />

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {/* Logo/title skeleton */}
            <div
              className="skeleton"
              style={{ width: "300px", height: "60px", borderRadius: "8px" }}
            />
            {/* Meta pills */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[80, 100, 60, 90].map((w, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{
                    width: `${w}px`,
                    height: "32px",
                    borderRadius: "8px",
                  }}
                />
              ))}
            </div>
            {/* Description */}
            <div
              className="skeleton"
              style={{ width: "100%", height: "16px", borderRadius: "4px" }}
            />
            <div
              className="skeleton"
              style={{ width: "85%", height: "16px", borderRadius: "4px" }}
            />
            <div
              className="skeleton"
              style={{ width: "70%", height: "16px", borderRadius: "4px" }}
            />
            {/* Buttons */}
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
              <div
                className="skeleton"
                style={{ width: "140px", height: "50px", borderRadius: "12px" }}
              />
              <div
                className="skeleton"
                style={{ width: "140px", height: "50px", borderRadius: "12px" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
