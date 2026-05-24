import { useState } from "react";
import { createGist, loadFromGist } from "../data/gistStorage.js";

function extractGistId(input) {
  const trimmed = input.trim();
  const match = trimmed.match(/([a-f0-9]{20,})/i);
  return match ? match[1] : trimmed;
}

function Landing({ onGuest, onGitHub }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#faf9f6",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', system-ui, sans-serif", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#999", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>✈ tloose</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, margin: "0 0 10px", letterSpacing: -0.8, color: "#1a1a1a" }}>Plan your trip.</h1>
          <p style={{ fontSize: 15, color: "#888", margin: 0, lineHeight: 1.5 }}>Itineraries, food, budgets — all in one place.</p>
        </div>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={onGuest}
            style={{
              width: "100%", padding: "14px 0", background: "#1a1a1a", color: "#fff",
              border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s",
            }}
            onMouseEnter={e => e.target.style.opacity = 0.85}
            onMouseLeave={e => e.target.style.opacity = 1}
          >
            Start planning
          </button>
          <p style={{ textAlign: "center", fontSize: 12, color: "#bbb", margin: "0 0 4px" }}>Saved locally on this device</p>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#e8e6e0" }} />
            <span style={{ fontSize: 12, color: "#bbb" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#e8e6e0" }} />
          </div>

          <button
            onClick={onGitHub}
            style={{
              width: "100%", padding: "13px 0", background: "#fff", color: "#1a1a1a",
              border: "1px solid #e8e6e0", borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.15s",
            }}
            onMouseEnter={e => e.target.style.borderColor = "#1a1a1a"}
            onMouseLeave={e => e.target.style.borderColor = "#e8e6e0"}
          >
            Sync across devices with GitHub →
          </button>
          <p style={{ textAlign: "center", fontSize: 12, color: "#bbb", margin: 0 }}>Requires a free GitHub account</p>
        </div>
      </div>
    </div>
  );
}

function GitHubForm({ onConnect, onBack, getInitialDb }) {
  const [token, setToken] = useState("");
  const [mode, setMode] = useState("new");
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
        await loadFromGist(token.trim(), gistId);
        onConnect({ token: token.trim(), gistId, db: null });
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box", border: "1px solid #e8e6e0", borderRadius: 8,
    padding: "10px 12px", fontSize: 13, color: "#1a1a1a", background: "#faf9f6",
    outline: "none", fontFamily: "inherit", transition: "border-color 0.15s",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#faf9f6",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', system-ui, sans-serif", padding: 20,
    }}>
      <div style={{
        background: "#fff", border: "1px solid #e8e6e0", borderRadius: 16,
        padding: "32px 36px", width: "100%", maxWidth: 420,
        boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#999", padding: "0 0 20px", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
          ← Back
        </button>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>✈ tloose</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px", letterSpacing: -0.4, color: "#1a1a1a" }}>Connect to GitHub</h2>
        <p style={{ fontSize: 13, color: "#888", margin: "0 0 24px", lineHeight: 1.55 }}>
          Your trips will be saved to a private GitHub Gist and sync across all your devices automatically.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>Personal Access Token</label>
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
              <button type="button" onClick={() => setShowToken(v => !v)} style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#999", padding: "2px 4px", fontFamily: "inherit",
              }}>{showToken ? "Hide" : "Show"}</button>
            </div>
            <a href="https://github.com/settings/tokens/new?scopes=gist&description=Trip+Planner" target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: "#4a6ee0", textDecoration: "none", marginTop: 6, display: "inline-block" }}>
              Create a token with gist scope →
            </a>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>Storage</label>
            <div style={{ display: "flex", background: "#efede8", borderRadius: 8, padding: 2 }}>
              {[["new", "Create new gist"], ["existing", "Use existing gist"]].map(([val, label]) => (
                <button key={val} type="button" onClick={() => setMode(val)} style={{
                  flex: 1, padding: "7px 0", border: "none", borderRadius: 6,
                  background: mode === val ? "#fff" : "transparent",
                  color: mode === val ? "#1a1a1a" : "#999",
                  fontSize: 12, fontWeight: mode === val ? 600 : 400,
                  cursor: "pointer", fontFamily: "inherit",
                  boxShadow: mode === val ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s",
                }}>{label}</button>
              ))}
            </div>
          </div>

          {mode === "existing" && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>Gist ID or URL</label>
              <input
                type="text" value={gistIdInput} onChange={e => setGistIdInput(e.target.value)}
                placeholder="abc123… or gist.github.com/…" spellCheck={false}
                style={{ ...inputStyle, fontFamily: "monospace" }}
                onFocus={e => e.target.style.borderColor = "#4a6ee0"}
                onBlur={e => e.target.style.borderColor = "#e8e6e0"}
              />
            </div>
          )}

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            background: "#4a6ee0", color: "#fff", border: "none", borderRadius: 8,
            padding: "12px 0", fontSize: 14, fontWeight: 600,
            cursor: loading ? "wait" : "pointer", fontFamily: "inherit",
            opacity: loading ? 0.7 : 1, transition: "opacity 0.15s", marginTop: 2,
          }}>
            {loading ? "Connecting…" : mode === "new" ? "Create & Connect" : "Connect"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function GistSetup({ onConnect, onGuest, getInitialDb }) {
  const [step, setStep] = useState("landing"); // "landing" | "github"

  if (step === "github") {
    return <GitHubForm onConnect={onConnect} onBack={() => setStep("landing")} getInitialDb={getInitialDb} />;
  }

  return <Landing onGuest={onGuest} onGitHub={() => setStep("github")} />;
}
