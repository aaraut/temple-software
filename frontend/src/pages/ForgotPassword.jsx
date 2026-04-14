import { useState } from "react";
import { forgotPasswordApi } from "../api/authApi";
import { useNavigate } from "react-router-dom";

const C = {
  accent:   "#c8894a",
  accentDk: "#9a6030",
  border:   "#e8ddd0",
  text:     "#2d1f0f",
  muted:    "#8a7560",
  green:    "#2d7a2d",
  red:      "#b03030",
};

const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    )}
  </svg>
);

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  padding: "0.75rem 1rem",
  border: `1.5px solid ${C.border}`,
  borderRadius: "10px", fontSize: "0.9rem",
  background: "#fdf9f4", color: C.text,
  fontFamily: "inherit", outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

function TextField({ label, value, onChange, placeholder, maxLength, autoComplete }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1 }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.muted, letterSpacing: "0.04em" }}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete || "off"}
        style={inputStyle}
        onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}18`; }}
        onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
      />
    </div>
  );
}

function PwdField({ label, value, onChange, show, onToggle, borderColor }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1 }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.muted, letterSpacing: "0.04em" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete="new-password"
          style={{ ...inputStyle, paddingRight: "2.8rem", border: `1.5px solid ${borderColor || C.border}` }}
          onFocus={e => { if (!borderColor) e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}18`; }}
          onBlur={e => { if (!borderColor) e.target.style.borderColor = borderColor || C.border; e.target.style.boxShadow = "none"; }}
        />
        <button type="button" onClick={onToggle} style={{
          position: "absolute", right: "0.8rem", top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer",
          color: C.muted, padding: 0, display: "flex", alignItems: "center",
          transition: "color 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.color = C.accent}
          onMouseLeave={e => e.currentTarget.style.color = C.muted}
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </div>
  );
}

function DobPicker({ onChange, labels }) {
  const [d, setD] = useState("");
  const [m, setM] = useState("");
  const [y, setY] = useState("");

  const notify = (nd, nm, ny) => {
    if (nd && nm && ny && ny.length === 4) {
      onChange(`${ny}-${nm.padStart(2,"0")}-${nd.padStart(2,"0")}`);
    } else {
      onChange("");
    }
  };

  const seg = { ...inputStyle, textAlign: "center", padding: "0.75rem 0.4rem" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.muted, letterSpacing: "0.04em" }}>{labels.dob}</label>
      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
        <input placeholder={labels.dd} maxLength={2} value={d}
          onChange={e => { const v = e.target.value.replace(/\D/g,"").slice(0,2); setD(v); notify(v, m, y); }}
          style={{ ...seg, flex: 1 }}
          onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}18`; }}
          onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }} />
        <span style={{ color: C.muted, fontWeight: 700, fontSize: "1rem", flexShrink: 0 }}>/</span>
        <input placeholder={labels.mm} maxLength={2} value={m}
          onChange={e => { const v = e.target.value.replace(/\D/g,"").slice(0,2); setM(v); notify(d, v, y); }}
          style={{ ...seg, flex: 1 }}
          onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}18`; }}
          onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }} />
        <span style={{ color: C.muted, fontWeight: 700, fontSize: "1rem", flexShrink: 0 }}>/</span>
        <input placeholder={labels.yyyy} maxLength={4} value={y}
          onChange={e => { const v = e.target.value.replace(/\D/g,"").slice(0,4); setY(v); notify(d, m, v); }}
          style={{ ...seg, flex: 2 }}
          onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}18`; }}
          onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }} />
      </div>
    </div>
  );
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const language = sessionStorage.getItem("appLanguage") || "hi";

  const t = language === "hi" ? {
    title:    "पासवर्ड भूल गए?",
    subtitle: "पहचान सत्यापित करें और नया पासवर्ड सेट करें",
    username: "यूज़रनेम",
    dob:      "जन्म तिथि",
    dd: "दिन", mm: "माह", yyyy: "वर्ष",
    aadhaar:  "आधार के अंतिम 4 अंक",
    newPwd:   "नया पासवर्ड",
    confirm:  "पासवर्ड पुष्टि करें",
    btn:      "पासवर्ड रीसेट करें",
    back:     "← लॉगिन पर जाएं",
    mismatch: "नया पासवर्ड और पुष्टि मेल नहीं खाते",
    weak:     "पासवर्ड कम से कम 6 अक्षर का होना चाहिए",
    error:    "पहचान सत्यापन विफल। यूज़रनेम, जन्म तिथि या आधार जांचें।",
    success:  "पासवर्ड सफलतापूर्वक रीसेट हुआ!",
    redirect: "लॉगिन पेज पर जा रहे हैं...",
    match:    "✓ पासवर्ड मेल खाते हैं",
    noMatch:  "✗ पासवर्ड मेल नहीं खाते",
    ok: "ठीक", strong: "मजबूत", weakLabel: "कमज़ोर",
    step1: "पहचान", step2: "नया पासवर्ड",
  } : {
    title:    "Forgot Password?",
    subtitle: "Verify your identity and set a new password",
    username: "Username",
    dob:      "Date of Birth",
    dd: "DD", mm: "MM", yyyy: "YYYY",
    aadhaar:  "Aadhaar Last 4 Digits",
    newPwd:   "New Password",
    confirm:  "Confirm Password",
    btn:      "Reset Password",
    back:     "← Back to Login",
    mismatch: "Passwords do not match",
    weak:     "Password must be at least 6 characters",
    error:    "Identity verification failed. Check username, date of birth, or Aadhaar.",
    success:  "Password reset successfully!",
    redirect: "Redirecting to login...",
    match:    "✓ Passwords match",
    noMatch:  "✗ Passwords don't match",
    ok: "OK", strong: "Strong", weakLabel: "Weak",
    step1: "Identity", step2: "New Password",
  };

  const [username,  setUsername]  = useState("");
  const [dob,       setDob]       = useState("");
  const [aadhaar,   setAadhaar]   = useState("");
  const [newPwd,    setNew]       = useState("");
  const [conf,      setConf]      = useState("");
  const [showNew,   setShowNew]   = useState(false);
  const [showCon,   setShowCon]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);
  const [saving,    setSaving]    = useState(false);

  const pwdMatch = conf.length > 0 && newPwd === conf;
  const strength = newPwd.length === 0 ? 0 : newPwd.length < 4 ? 1 : newPwd.length < 8 ? 2 : newPwd.length < 12 ? 3 : 4;
  const strColor = strength <= 1 ? C.red : strength <= 2 ? C.accent : C.green;
  const strLabel = strength <= 1 ? t.weakLabel : strength <= 2 ? t.ok : t.strong;
  const ready    = username && dob && aadhaar.length === 4 && newPwd.length >= 6 && pwdMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPwd.length < 6) { setError(t.weak);     return; }
    if (newPwd !== conf)   { setError(t.mismatch); return; }
    setSaving(true);
    try {
      await forgotPasswordApi({ username, dob, aadhaarLast4: aadhaar, newPassword: newPwd });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1800);
    } catch {
      setError(t.error);
    } finally {
      setSaving(false);
    }
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
        width: "100%", maxWidth: 680, position: "relative",
        background: "#fff", borderRadius: "22px",
        border: `1px solid ${C.border}`,
        boxShadow: "0 10px 50px rgba(139,100,60,0.12), 0 2px 10px rgba(139,100,60,0.07)",
        overflow: "hidden",
      }}>
        <div style={{ height: 5, background: `linear-gradient(90deg, ${C.accent}, ${C.accentDk}, ${C.accent})` }} />

        {/* Header */}
        <div style={{ padding: "2rem 2.5rem 1.6rem", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.accent}18, ${C.accent}35)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.8rem", margin: "0 auto 1rem",
            border: `2px solid ${C.accent}25`,
          }}>🔓</div>
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: C.text }}>{t.title}</h2>
          <p style={{ margin: "0.4rem 0 0", fontSize: "0.82rem", color: C.muted }}>{t.subtitle}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "1.8rem 2.5rem 2.2rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>

          {/* Step 1 label */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#fff" }}>1</span>
            </div>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{t.step1}</span>
          </div>

          {/* Username + Aadhaar on one row */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <TextField label={t.username} value={username} onChange={setUsername} placeholder={t.username} autoComplete="username" />
            <TextField label={t.aadhaar} value={aadhaar}
              onChange={v => setAadhaar(v.replace(/\D/g,"").slice(0,4))}
              placeholder="XXXX" maxLength={4} />
          </div>

          {/* DOB full width */}
          <DobPicker onChange={setDob} labels={t} />

          {/* Error — between identity and password section */}
          {error && (
            <div style={{
              display: "flex", gap: "0.6rem", alignItems: "flex-start",
              background: "#fff0f0", border: `1.5px solid ${C.red}`,
              borderRadius: 10, padding: "0.75rem 1rem",
            }}>
              <span style={{ fontSize: "1.1rem", flexShrink: 0, lineHeight: 1.2 }}>🚨</span>
              <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: C.red }}>{error}</p>
            </div>
          )}

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#fff" }}>2</span>
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{t.step2}</span>
            </div>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          {/* New + Confirm on one row */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <PwdField label={t.newPwd} value={newPwd} onChange={setNew}
              show={showNew} onToggle={() => setShowNew(v => !v)}
              borderColor={newPwd.length > 0 ? strColor : null} />
            <PwdField label={t.confirm} value={conf} onChange={setConf}
              show={showCon} onToggle={() => setShowCon(v => !v)}
              borderColor={conf.length > 0 ? (pwdMatch ? C.green : C.red) : null} />
          </div>

          {/* Strength + match */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "-0.7rem" }}>
            <div style={{ flex: 1 }}>
              {newPwd.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <div style={{ flex: 1, display: "flex", gap: "0.2rem" }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: strength >= i ? strColor : "#f0ebe4", transition: "background 0.25s" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: strColor, minWidth: "2.8rem" }}>{strLabel}</span>
                </div>
              )}
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
              {conf.length > 0 && (
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: pwdMatch ? C.green : C.red }}>
                  {pwdMatch ? t.match : t.noMatch}
                </span>
              )}
            </div>
          </div>

          {/* Success */}
          {success && (
            <div style={{ display: "flex", gap: "0.5rem", background: "#e8f5e8", border: `1px solid ${C.green}30`, borderRadius: 9, padding: "0.7rem 1rem" }}>
              <span>✅</span>
              <div>
                <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: C.green }}>{t.success}</p>
                <p style={{ margin: "0.1rem 0 0", fontSize: "0.72rem", color: C.green }}>{t.redirect}</p>
              </div>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={!ready || saving || success} style={{
            padding: "0.85rem",
            background: (!ready || saving || success) ? "#e8e0d8" : `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`,
            color: (!ready || saving || success) ? "#b0a090" : "#fff",
            border: "none", borderRadius: 11, fontSize: "0.92rem", fontWeight: 700,
            cursor: (!ready || saving || success) ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            boxShadow: (!ready || saving || success) ? "none" : `0 4px 16px ${C.accent}45`,
            transition: "all 0.2s",
          }}>
            {saving ? "⏳ ..." : success ? "✓" : t.btn}
          </button>

          {/* Back to login */}
          <button type="button" onClick={() => navigate("/login")} style={{
            background: "none", border: "none", cursor: "pointer",
            color: C.muted, fontSize: "0.8rem", fontFamily: "inherit",
            fontWeight: 600, textAlign: "center", padding: 0,
            transition: "color 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.color = C.accent}
            onMouseLeave={e => e.currentTarget.style.color = C.muted}
          >
            {t.back}
          </button>

        </form>
      </div>
    </div>
  );
}
