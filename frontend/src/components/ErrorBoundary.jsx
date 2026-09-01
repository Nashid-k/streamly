import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);

    // Auto-reload on Vite chunk splitting errors (deployment updates)
    if (
      error &&
      error.message &&
      (error.message.includes("Failed to fetch dynamically imported module") ||
        error.message.includes("Importing a module script failed"))
    ) {
      const lastReload = sessionStorage.getItem("chunk_reload_time");
      const now = Date.now();
      // Only reload if we haven't reloaded in the last 10 seconds to prevent infinite loops
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem("chunk_reload_time", now.toString());
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (
        this.state.error?.message?.includes(
          "Failed to fetch dynamically imported module",
        ) ||
        this.state.error?.message?.includes("Importing a module script failed")
      ) {
        return (
          <div
            style={{
              padding: "4rem",
              textAlign: "center",
              minHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <h1
              style={{ color: "#fff", marginBottom: "1rem", fontSize: "2rem" }}
            >
              Updating Application...
            </h1>
            <p style={{ color: "#a1a1aa" }}>
              We are fetching the latest version. Please wait a moment...
            </p>
          </div>
        );
      }

      return (
        <div
          style={{
            padding: "4rem",
            textAlign: "center",
            minHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h1
            style={{
              color: "#ef4444",
              marginBottom: "1rem",
              fontSize: "2.5rem",
            }}
          >
            Oops! Something went wrong.
          </h1>
          <p style={{ color: "#a1a1aa", marginBottom: "2rem" }}>
            We're sorry, an unexpected error occurred.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = "/";
            }}
            style={{
              background: "#e50914",
              color: "white",
              border: "none",
              padding: "0.8rem 1.5rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Return to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
