import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AuthProvider from "./context/AuthContext";
import "./index.css";

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error)
      return (
        <div style={{ padding: 32, textAlign: "center", fontFamily: "sans-serif" }}>
          <h2>Something went wrong 😕</h2>
          <p style={{ color: "#888", fontSize: 14 }}>{this.state.error.message}</p>
          <button onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
            style={{ marginTop: 16, padding: "10px 24px", background: "#eab308", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}>
            Clear & Re-login
          </button>
        </div>
      );
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);