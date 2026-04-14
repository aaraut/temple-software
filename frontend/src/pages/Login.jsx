import { useState } from "react";
import { loginApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/Jamsawali-Logo_new-4.png";

const C = {
  accent:   "#c8894a",
  accentDk: "#9a6030",
  border:   "#e8ddd0",
  text:     "#2d1f0f",
  muted:    "#8a7560",
  red:      "#b03030",
};

const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (<>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </>) : (<>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </>)}
  </svg>
);

export default function Login() {
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [language, setLanguage] = useState("hi");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const t = language === "hi" ? {
    title:    "नमस्ते 🙏",
    subtitle: "चमत्कारिक श्री हनुमान मंदिर जामसावली",
    username: "यूज़रनेम",
    password: "पासवर्ड",
    btn:      "लॉगिन करें",
    forgot:   "पासवर्ड भूल गए?",
    error:    "अमान्य यूज़रनेम या पासवर्ड",
  } : {
    title:    "Welcome 🙏",
    subtitle: "Chamatkarik Shree Hanuman Mandir Jamsawli",
    username: "Username",
    password: "Password",
    btn:      "Login",
    forgot:   "Forgot Password?",
    error:    "Invalid username or password",
  };

  const ready = username.trim().length > 0 && password.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginApi(username, password);
      login(data, language);
      if (data.forcePasswordChange) {
        window.location.replace("/change-password");
      } else {
        window.location.replace("/");
      }
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: "100%", boxSizing: "border-box",
    padding: "0.78rem 1rem",
    border: `1.5px solid ${C.border}`,
    borderRadius: "10px", fontSize: "0.9rem",
    background: "#fdf9f4", color: C.text,
    fontFamily: "inherit", outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(150deg, #fdf6ec 0%, #fdf9f4 55%, #f5ede0 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem 1rem", fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "fixed", top: "-140px", right: "-100px", width: 420, height: 420, borderRadius: "50%", background: `${C.accent}07`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-100px", left: "-80px", width: 300, height: 300, borderRadius: "50%", background: `${C.accent}05`, pointerEvents: "none" }} />

      <div style={{
        width: "100%", maxWidth: 460, position: "relative",
        background: "#fff", borderRadius: "22px",
        border: `1px solid ${C.border}`,
        boxShadow: "0 10px 50px rgba(139,100,60,0.12), 0 2px 10px rgba(139,100,60,0.07)",
        overflow: "hidden",
      }}>
        <div style={{ height: 5, background: `linear-gradient(90deg, ${C.accent}, ${C.accentDk}, ${C.accent})` }} />

        {/* Header */}
        <div style={{ padding: "2.2rem 2.5rem 1.8rem", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: "3rem", lineHeight: 1, marginBottom: "0.9rem", filter: "drop-shadow(0 2px 6px rgba(139,100,60,0.25))" }}>
            <img src={logo} alt="Hanuman" style={{ width: "3.8rem", height: "3.8rem" }} />
          </div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: C.text }}>{t.title}</h1>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: C.muted, lineHeight: 1.4 }}>{t.subtitle}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "1.8rem 2.5rem 2.2rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>

          {/* Language pill toggle */}
          <div style={{ display: "flex", background: "#fdf6ee", borderRadius: 10, padding: "0.2rem", border: `1px solid ${C.border}` }}>
            {["hi", "en"].map(lang => (
              <button key={lang} type="button" onClick={() => setLanguage(lang)} style={{
                flex: 1, padding: "0.45rem 0", border: "none", borderRadius: 8,
                background: language === lang ? `linear-gradient(135deg, ${C.accent}, ${C.accentDk})` : "transparent",
                color: language === lang ? "#fff" : C.muted,
                fontSize: "0.82rem", fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s",
              }}>
                {lang === "hi" ? "हिंदी" : "English"}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: "flex", gap: "0.6rem", alignItems: "center",
              background: "#fff0f0", border: `1.5px solid ${C.red}`,
              borderRadius: 10, padding: "0.7rem 1rem",
            }}>
              <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>🚨</span>
              <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: C.red }}>{error}</p>
            </div>
          )}

          {/* Username */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.muted, letterSpacing: "0.04em" }}>{t.username}</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder={t.username} autoComplete="username"
              style={inp}
              onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}18`; }}
              onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.muted, letterSpacing: "0.04em" }}>{t.password}</label>
              <button type="button" onClick={() => window.location.href = "/forgot-password"} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "0.72rem", fontWeight: 600, color: C.accent,
                fontFamily: "inherit", padding: 0, textDecoration: "underline",
              }}>{t.forgot}</button>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPwd ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t.password} autoComplete="current-password"
                style={{ ...inp, paddingRight: "2.8rem" }}
                onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}18`; }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                position: "absolute", right: "0.8rem", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: C.muted, padding: 0, display: "flex", alignItems: "center",
                transition: "color 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.color = C.accent}
                onMouseLeave={e => e.currentTarget.style.color = C.muted}
              >
                <EyeIcon open={showPwd} />
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={!ready || loading} style={{
            marginTop: "0.3rem", padding: "0.88rem",
            background: (!ready || loading) ? "#e8e0d8" : `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`,
            color: (!ready || loading) ? "#b0a090" : "#fff",
            border: "none", borderRadius: 11,
            fontSize: "0.95rem", fontWeight: 700,
            cursor: (!ready || loading) ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            boxShadow: (!ready || loading) ? "none" : `0 4px 16px ${C.accent}45`,
            transition: "all 0.2s", letterSpacing: "0.02em",
          }}
            onMouseEnter={e => { if (ready && !loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
          >
            {loading ? "⏳ ..." : t.btn}
          </button>

        </form>
      </div>
    </div>
  );
}
