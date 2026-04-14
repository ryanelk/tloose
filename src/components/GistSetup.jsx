import { useState } from "react";
import { createGist, loadFromGist } from "../data/gistStorage.js";

function extractGistId(input) {
  const trimmed = input.trim();
  // Handle full URLs like https://gist.github.com/user/abc123
  const match = trimmed.match(/([a-f0-9]{20,})/i);
  return match ? match[1] : trimmed;
}

export default function GistSetup({ onConnect, getInitialDb }) {
  const [token, setToken] = useState("");
  const [mode, setMode] = useState("new"); // "new" | "existing"
  const [gistIdInput, setGistIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) { setError("Token is required."); return; }
    setLoading(true);
    setError("");
    try {
      if (mode === "new") {
        const initialDb = getInitialDb();
        const gistId = await createGist(token.trim(), initialDb);
        onConnect({ token: token.trim(), gistId, db: initialDb });
      } else {
        const gistId = extractGistId(gistIdInput);
        if (!gistId) { setError("Gist ID is required."); setLoading(false); return; }
        await loadFromGist(token.trim(), gistId); // verify accessible
        onConnect({ token: token.trim(), gistId, db: null });
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    border: "1px solid #e8e6e0", borderRadius: 8,
    padding: "10px 12px", fontSize: 13, color: "#1a1a1a",
    background: "#faf9f6", outline: "none", fontFamily: "inherit",
    transition: "border-color 0.15s",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#faf9f6",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', system-ui, sans-serif", padding: 20,
    }}>
      <div style={{
        background: "#fff", border: "1px solid #e8e6e0", borderRadius: 16,
        padding: "36px 40px", width: "100%", maxWidth: 440,
        boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
          ✈ Trip Planner
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px", letterSpacing: -0.5, color: "#1a1a1a" }}>
          Connect to GitHub
        </h2>
        <p style={{ fontSize: 14, color: "#666", margin: "0 0 28px", lineHeight: 1.55 }}>
          Your trips are stored in a private GitHub Gist and sync automatically across all your devices.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Token */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>
              Personal Access Token
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="github_pat_…"
                autoComplete="off"
                spellCheck={false}
                style={{ ...inputStyle, paddingRight: 52, fontFamily: "monospace" }}
                onFocus={e => e.target.style.borderColor = "#4a6ee0"}
                onBlur={e => e.target.style.borderColor = "#e8e6e0"}
              />
              <button
                type="button"
                onClick={() => setShowToken(v => !v)}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 11, color: "#999", padding: "2px 4px", fontFamily: "inherit",
                }}
              >{showToken ? "Hide" : "Show"}</button>
            </div>
            <a
              href="https://github.com/settings/tokens/new?scopes=gist&description=Trip+Planner"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12, color: "#4a6ee0", textDecoration: "none", marginTop: 6, display: "inline-block" }}
            >
              Create a token with gist scope →
            </a>
          </div>

          {/* Mode toggle */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>
              Storage
            </label>
            <div style={{ display: "flex", background: "#efede8", borderRadius: 8, padding: 2 }}>
              {[["new", "Create new gist"], ["existing", "Use existing gist"]].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMode(val)}
                  style={{
                    flex: 1, padding: "7px 0", border: "none", borderRadius: 6,
                    background: mode === val ? "#fff" : "transparent",
                    color: mode === val ? "#1a1a1a" : "#999",
                    fontSize: 12, fontWeight: mode === val ? 600 : 400,
                    cursor: "pointer", fontFamily: "inherit",
                    boxShadow: mode === val ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s",
                  }}
                >{label}</button>
              ))}
            </div>
          </div>

          {/* Gist ID input for existing mode */}
          {mode === "existing" && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>
                Gist ID or URL
              </label>
              <input
                type="text"
                value={gistIdInput}
                onChange={e => setGistIdInput(e.target.value)}
                placeholder="abc123… or gist.github.com/…"
                spellCheck={false}
                style={{ ...inputStyle, fontFamily: "monospace" }}
                onFocus={e => e.target.style.borderColor = "#4a6ee0"}
                onBlur={e => e.target.style.borderColor = "#e8e6e0"}
              />
            </div>
          )}

          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#4a6ee0", color: "#fff", border: "none", borderRadius: 8,
              padding: "12px 0", fontSize: 14, fontWeight: 600,
              cursor: loading ? "wait" : "pointer", fontFamily: "inherit",
              opacity: loading ? 0.7 : 1, transition: "opacity 0.15s",
              marginTop: 2,
            }}
          >
            {loading ? "Connecting…" : mode === "new" ? "Create & Connect" : "Connect"}
          </button>
        </form>
      </div>
    </div>
  );
}
