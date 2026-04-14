import { useEffect, useState } from "react";
import { listUsers, createUser, updateUser, resetUserPassword, unlockUser } from "../api/userApi";
import { useAuth } from "../context/AuthContext";

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  bg:       "#fdf9f4",
  card:     "#ffffff",
  accent:   "#c8894a",
  accentDk: "#9a6030",
  border:   "#e8ddd0",
  borderFocus: "#c8894a",
  text:     "#2d1f0f",
  muted:    "#8a7560",
  green:    "#2d7a2d", greenBg: "#e8f5e8",
  red:      "#b03030", redBg:   "#fdf0f0",
  amber:    "#9a7020", amberBg: "#fffbe6",
  blue:     "#1a4a8a", blueBg:  "#e8f0fc",
};

// ─── Labels ─────────────────────────────────────────────────────────────────
const L = {
  en: {
    title: "User Management", subtitle: "Manage system users and access",
    addBtn: "＋ Add New User", close: "✕",
    formTitle: "Add New User", editTitle: "Edit User", resetTitle: "Reset Password",
    username: "Username", password: "Temporary Password", role: "Role",
    fullName: "Full Name", phone: "Phone Number", dob: "Date of Birth",
    day: "DD", month: "MM", year: "YYYY",
    aadhaar: "Aadhaar Last 4 Digits",
    create: "Create User", cancel: "Cancel", save: "Save Changes",
    resetBtn: "Reset Password", confirmReset: "Set New Password",
    tempPwd: "Temporary Password",
    errorRequired: "Username, password and role are required",
    errorAadhaar: "Aadhaar must be exactly 4 digits",
    errorFailed: "Failed to create user",
    loading: "Loading users...", noUsers: "No users found",
    unauthorized: "You are not authorized to view this page.",
    colNo: "#", colUser: "User", colRole: "Role",
    colStatus: "Status", colActions: "Actions",
    yes: "Active", no: "Inactive", locked: "Locked",
    edit: "Edit", resetPwd: "Reset Password", unlock: "Unlock",
    unlockConfirm: (u) => `Unlock user "${u}"?`,
    successCreated: "User created successfully",
    successReset: "Password reset successfully",
    successUnlock: (u) => `${u} unlocked`,
    errorLoad: "Failed to load users",
  },
  hi: {
    title: "यूज़र प्रबंधन", subtitle: "सिस्टम यूज़र और एक्सेस प्रबंधित करें",
    addBtn: "＋ नया यूज़र जोड़ें", close: "✕",
    formTitle: "नया यूज़र जोड़ें", editTitle: "यूज़र संपादित करें", resetTitle: "पासवर्ड रीसेट",
    username: "यूज़रनेम", password: "अस्थायी पासवर्ड", role: "भूमिका",
    fullName: "पूरा नाम", phone: "फोन नंबर", dob: "जन्म तिथि",
    day: "दिन", month: "माह", year: "वर्ष",
    aadhaar: "आधार के अंतिम 4 अंक",
    create: "यूज़र बनाएं", cancel: "रद्द करें", save: "बदलाव सहेजें",
    resetBtn: "पासवर्ड रीसेट", confirmReset: "नया पासवर्ड सेट करें",
    tempPwd: "अस्थायी पासवर्ड",
    errorRequired: "यूज़रनेम, पासवर्ड और भूमिका आवश्यक हैं",
    errorAadhaar: "आधार के केवल अंतिम 4 अंक भरें",
    errorFailed: "यूज़र बनाने में विफल",
    loading: "लोड हो रहा है...", noUsers: "कोई यूज़र नहीं मिला",
    unauthorized: "आप इस पृष्ठ को देखने के लिए अधिकृत नहीं हैं।",
    colNo: "#", colUser: "यूज़र", colRole: "भूमिका",
    colStatus: "स्थिति", colActions: "कार्य",
    yes: "सक्रिय", no: "निष्क्रिय", locked: "लॉक्ड",
    edit: "संपादित करें", resetPwd: "पासवर्ड रीसेट", unlock: "अनलॉक",
    unlockConfirm: (u) => `यूज़र "${u}" को अनलॉक करें?`,
    successCreated: "यूज़र सफलतापूर्वक बनाया गया",
    successReset: "पासवर्ड सफलतापूर्वक रीसेट हुआ",
    successUnlock: (u) => `${u} अनलॉक किया गया`,
    errorLoad: "यूज़र लोड करने में विफल",
  },
};

// ─── Shared input style ──────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", boxSizing: "border-box",
  padding: "0.55rem 0.75rem",
  background: "#fdf9f4",
  border: `1px solid ${C.border}`,
  borderRadius: "8px",
  fontSize: "0.85rem",
  color: C.text,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s",
};
const focusStyle = { borderColor: C.borderFocus, background: "#fff" };

const Field = ({ label, required, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: C.muted, letterSpacing: "0.04em" }}>
      {label}{required && <span style={{ color: C.accent }}> *</span>}
    </label>
    {children}
  </div>
);

const Input = ({ style: extraStyle, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{ ...inputStyle, ...(focused ? focusStyle : {}), ...(extraStyle || {}) }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
};

const Select = ({ children, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      style={{ ...inputStyle, ...(focused ? focusStyle : {}), cursor: "pointer" }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </select>
  );
};

// ─── Split DOB picker: DD / MM / YYYY ────────────────────────────────────────
const DobPicker = ({ value, onChange, t }) => {
  // Parse existing value (YYYY-MM-DD) into parts for initial state
  const parseVal = (v) => {
    if (!v) return { d: "", m: "", y: "" };
    const parts = v.split("-");
    return parts.length === 3 ? { y: parts[0], m: parts[1], d: parts[2] } : { d: "", m: "", y: "" };
  };

  const [parts, setParts] = useState(() => parseVal(value));

  const update = (field, val) => {
    const next = { ...parts, [field]: val };
    setParts(next);
    // Emit combined YYYY-MM-DD only when all three have values
    if (next.y && next.m && next.d) {
      onChange(next.y + "-" + next.m.padStart(2,"0") + "-" + next.d.padStart(2,"0"));
    } else {
      onChange("");
    }
  };

  const seg = {
    ...inputStyle,
    textAlign: "center",
    padding: "0.55rem 0.4rem",
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <span style={{ fontSize: "0.6rem", color: C.muted, marginBottom: 2, textAlign: "center" }}>{t.day}</span>
        <input
          type="text" inputMode="numeric" maxLength={2}
          placeholder="DD" value={parts.d}
          onChange={e => update("d", e.target.value.replace(/\D/g,"").slice(0,2))}
          style={{ ...seg }}
          onFocus={e => e.target.style.borderColor = C.borderFocus}
          onBlur={e => e.target.style.borderColor = C.border} />
      </div>
      <span style={{ color: C.muted, fontWeight: 700, fontSize: "1rem", paddingTop: "1.2rem" }}>/</span>
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <span style={{ fontSize: "0.6rem", color: C.muted, marginBottom: 2, textAlign: "center" }}>{t.month}</span>
        <input
          type="text" inputMode="numeric" maxLength={2}
          placeholder="MM" value={parts.m}
          onChange={e => update("m", e.target.value.replace(/\D/g,"").slice(0,2))}
          style={{ ...seg }}
          onFocus={e => e.target.style.borderColor = C.borderFocus}
          onBlur={e => e.target.style.borderColor = C.border} />
      </div>
      <span style={{ color: C.muted, fontWeight: 700, fontSize: "1rem", paddingTop: "1.2rem" }}>/</span>
      <div style={{ display: "flex", flexDirection: "column", flex: 2 }}>
        <span style={{ fontSize: "0.6rem", color: C.muted, marginBottom: 2, textAlign: "center" }}>{t.year}</span>
        <input
          type="text" inputMode="numeric" maxLength={4}
          placeholder="YYYY" value={parts.y}
          onChange={e => update("y", e.target.value.replace(/\D/g,"").slice(0,4))}
          style={{ ...seg }}
          onFocus={e => e.target.style.borderColor = C.borderFocus}
          onBlur={e => e.target.style.borderColor = C.border} />
      </div>
    </div>
  );
};

// ─── User Form (shared for add + edit) ───────────────────────────────────────
function UserForm({ initial, allowedRoles, onSave, onCancel, t, mode }) {
  const [form, setForm] = useState(initial || {
    username: "", password: "", role: allowedRoles[0] || "USER",
    name: "", phone: "", dob: "", aadhaarLast4: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Disable save when required fields empty
  const formReady = mode === "add"
    ? !!(form.username?.trim() && form.password?.trim() && form.role)
    : !!(form.role);

  const submit = async () => {
    setError("");
    if (mode === "add" && (!form.username || !form.password || !form.role)) { setError(t.errorRequired); return; }
    if (form.aadhaarLast4 && form.aadhaarLast4.length !== 4) { setError(t.errorAadhaar); return; }
    setSaving(true);
    try { await onSave(form); }
    catch (e) { setError(e?.response?.data?.message || e?.message || t.errorFailed); }
    finally { setSaving(false); }
  };

  return (
    <div>
      {error && (
        <div style={{ background: C.redBg, border: `1px solid ${C.red}30`, borderRadius: 8, padding: "0.6rem 0.9rem", marginBottom: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.8rem", color: C.red }}>{error}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {mode === "add" && (
          <>
            <Field label={t.username} required>
              <Input name="username" placeholder={t.username} value={form.username}
                onChange={e => set("username", e.target.value)} autoComplete="off" />
            </Field>
            <Field label={t.password} required>
              <Input name="password" type="password" placeholder={t.password} value={form.password}
                onChange={e => set("password", e.target.value)} autoComplete="new-password" />
            </Field>
          </>
        )}
        <Field label={t.role} required>
          <Select value={form.role} onChange={e => set("role", e.target.value)}>
            {allowedRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </Field>
        <Field label={t.fullName}>
          <Input placeholder={t.fullName} value={form.name || ""}
            onChange={e => set("name", e.target.value)} />
        </Field>
        <Field label={t.phone}>
          <Input placeholder="10 digits" value={form.phone || ""}
            onChange={e => set("phone", e.target.value.replace(/\D/g,"").slice(0,10))} />
        </Field>
        <Field label={t.dob}>
          <DobPicker value={form.dob || ""} onChange={v => set("dob", v)} t={t} />
        </Field>
        <Field label={t.aadhaar}>
          <Input placeholder="XXXX" maxLength={4} value={form.aadhaarLast4 || ""}
            onChange={e => set("aadhaarLast4", e.target.value.replace(/\D/g,"").slice(0,4))} />
        </Field>
      </div>

      <div style={{ display: "flex", gap: "0.7rem", marginTop: "1.4rem", justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{
          padding: "0.6rem 1.3rem", background: "transparent", border: `1.5px solid ${C.border}`,
          borderRadius: 8, color: C.muted, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit", transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
          {t.cancel}
        </button>
        <button onClick={submit} disabled={saving || !formReady} style={{
          padding: "0.6rem 1.5rem",
          background: (saving || !formReady) ? "#e8e0d8" : `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`,
          color: (saving || !formReady) ? "#aaa" : "#fff",
          border: "none", borderRadius: 8,
          fontSize: "0.82rem", fontWeight: 700,
          cursor: (saving || !formReady) ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          boxShadow: (saving || !formReady) ? "none" : "0 3px 10px rgba(168,104,48,0.3)",
          transition: "all 0.15s",
        }}>
          {saving ? "..." : mode === "add" ? t.create : t.save}
        </button>
      </div>
    </div>
  );
}

// ─── Reset Password Form ──────────────────────────────────────────────────────
function ResetForm({ user, onSave, onCancel, t }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!pwd) { setError("Password is required"); return; }
    setSaving(true);
    try { await onSave(pwd); }
    catch (e) { setError(e?.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: C.muted }}>
        {user.username}
      </p>
      {error && <p style={{ color: C.red, fontSize: "0.78rem", marginBottom: "0.8rem" }}>{error}</p>}
      <Field label={t.tempPwd}>
        <Input type="password" placeholder={t.tempPwd} value={pwd}
          onChange={e => setPwd(e.target.value)} autoComplete="new-password" />
      </Field>
      <div style={{ display: "flex", gap: "0.7rem", marginTop: "1.2rem", justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{
          padding: "0.55rem 1.2rem", background: "transparent", border: `1.5px solid ${C.border}`,
          borderRadius: 8, color: C.muted, fontSize: "0.8rem", fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
        }}>{t.cancel}</button>
        <button onClick={submit} disabled={saving || !pwd.trim()} style={{
          padding: "0.55rem 1.4rem",
          background: (saving || !pwd.trim()) ? "#e8e0d8" : `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`,
          color: (saving || !pwd.trim()) ? "#aaa" : "#fff",
          border: "none", borderRadius: 8,
          fontSize: "0.8rem", fontWeight: 700,
          cursor: (saving || !pwd.trim()) ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          boxShadow: (saving || !pwd.trim()) ? "none" : "0 3px 10px rgba(168,104,48,0.3)",
        }}>
          {saving ? "..." : t.confirmReset}
        </button>
      </div>
    </div>
  );
}

// ─── Slide-in Panel ───────────────────────────────────────────────────────────
function Panel({ title, onClose, children }) {
  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(45,31,15,0.35)",
        zIndex: 100, backdropFilter: "blur(2px)",
      }} />
      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, height: "100vh",
        width: "min(600px, 96vw)", background: C.card,
        boxShadow: "-8px 0 40px rgba(45,31,15,0.18)",
        zIndex: 101, display: "flex", flexDirection: "column",
        animation: "slideIn 0.22s ease-out",
      }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Panel header */}
        <div style={{
          padding: "1.2rem 1.5rem", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: `linear-gradient(135deg, ${C.accent}15, transparent)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: 3, height: 20, background: C.accent, borderRadius: 2 }} />
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: C.text }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "1.1rem", color: C.muted, lineHeight: 1, padding: "0.2rem",
          }}>✕</button>
        </div>

        {/* Panel body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.4rem 1.5rem" }}>
          {children}
        </div>
      </div>
    </>
  );
}

// ─── Role badge ──────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const colors = {
    SUPER_ADMIN: { bg: "#fdf0f0", color: C.red, border: `${C.red}30` },
    ADMIN:       { bg: C.amberBg, color: C.amber, border: `${C.amber}30` },
    USER:        { bg: C.blueBg, color: C.blue, border: `${C.blue}30` },
  };
  const s = colors[role] || colors.USER;
  return (
    <span style={{
      display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: 5,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.05em",
    }}>{role}</span>
  );
};

// ─── Status badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ active, locked, t }) => {
  if (locked) return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "0.2rem 0.6rem", borderRadius: 5, background: C.amberBg, color: C.amber, border: `1px solid ${C.amber}30`, fontSize: "0.68rem", fontWeight: 700 }}>
      🔒 {t.locked}
    </span>
  );
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "0.2rem 0.6rem", borderRadius: 5, background: active ? C.greenBg : C.redBg, color: active ? C.green : C.red, border: `1px solid ${active ? C.green : C.red}30`, fontSize: "0.68rem", fontWeight: 700 }}>
      {active ? "●" : "○"} {active ? t.yes : t.no}
    </span>
  );
};

// ─── Icon button ─────────────────────────────────────────────────────────────
const IconBtn = ({ children, onClick, color = C.muted, bg = "#f5f0eb", title }) => (
  <button title={title} onClick={onClick} style={{
    background: bg, border: "none", borderRadius: 6,
    padding: "0.3rem 0.6rem", cursor: "pointer", fontSize: "0.72rem",
    fontWeight: 600, color: color, fontFamily: "inherit", transition: "all 0.15s",
    display: "inline-flex", alignItems: "center", gap: "0.25rem",
  }}
    onMouseEnter={e => { e.currentTarget.style.filter = "brightness(0.92)"; }}
    onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}>
    {children}
  </button>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserList() {
  const { auth, language } = useAuth();
  const t = L[language] ?? L.en;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [panel, setPanel] = useState(null); // "add" | "edit" | "reset"
  const [activeUser, setActiveUser] = useState(null);

  const isAdmin = auth.role === "ADMIN" || auth.role === "SUPER_ADMIN";
  const allowedRoles = auth.role === "SUPER_ADMIN" ? ["ADMIN", "USER"] : ["USER"];

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const load = async () => {
    try { setLoading(true); setUsers(await listUsers()); }
    catch { setError(t.errorLoad); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin) load(); }, []);

  const closePanel = () => { setPanel(null); setActiveUser(null); };

  const handleAdd = async (form) => {
    await createUser(form);
    showToast(t.successCreated);
    closePanel(); load();
  };

  const handleEdit = async (form) => {
    await updateUser(activeUser.id, form);
    showToast(t.save); closePanel(); load();
  };

  const handleReset = async (pwd) => {
    await resetUserPassword(activeUser.id, pwd);
    showToast(t.successReset); closePanel();
  };

  const handleUnlock = async (u) => {
    if (!window.confirm(t.unlockConfirm(u.username))) return;
    await unlockUser(u.id);
    showToast(t.successUnlock(u.username)); load();
  };

  if (!isAdmin) return (
    <div style={{ padding: "3rem", textAlign: "center", color: C.muted }}>{t.unauthorized}</div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "1.5rem 2rem", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", top: "1.2rem", right: "1.2rem", zIndex: 200,
          background: C.green, color: "#fff", padding: "0.7rem 1.2rem",
          borderRadius: 10, fontSize: "0.82rem", fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          animation: "slideIn 0.2s ease-out",
        }}>
          ✓ {toast}
        </div>
      )}

      {/* ── Page header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, color: C.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            {language === "hi" ? "प्रशासन" : "Administration"}
          </p>
          <h1 style={{ margin: "0.1rem 0 0", fontSize: "1.6rem", fontWeight: 800, color: C.text, lineHeight: 1 }}>
            {t.title}
          </h1>
        </div>
        <button
          onClick={() => setPanel("add")}
          style={{
            padding: "0.65rem 1.4rem",
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`,
            color: "#fff", border: "none", borderRadius: 10, fontFamily: "inherit",
            fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 14px rgba(168,104,48,0.3)",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "none"}
        >
          {t.addBtn}
        </button>
      </div>

      {error && (
        <div style={{ background: C.redBg, border: `1px solid ${C.red}30`, borderRadius: 8, padding: "0.7rem 1rem", marginBottom: "1rem" }}>
          <p style={{ margin: 0, color: C.red, fontSize: "0.82rem" }}>{error}</p>
        </div>
      )}

      {/* ── Stats row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.8rem", marginBottom: "1.4rem" }}>
        {[
          { label: language === "hi" ? "कुल यूज़र" : "Total Users", value: users.length, color: C.accent },
          { label: language === "hi" ? "सक्रिय" : "Active", value: users.filter(u => u.active).length, color: C.green },
          { label: language === "hi" ? "निष्क्रिय" : "Inactive", value: users.filter(u => !u.active).length, color: C.muted },
          { label: language === "hi" ? "लॉक्ड" : "Locked", value: users.filter(u => u.accountLocked).length, color: C.amber },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: C.card, borderRadius: 12, padding: "0.9rem 1.1rem", border: `1px solid ${C.border}`, boxShadow: "0 1px 6px rgba(139,100,60,0.06)" }}>
            <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
            <p style={{ margin: "0.2rem 0 0", fontSize: "1.6rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 2px 16px rgba(139,100,60,0.07)" }}>

        {/* Table header */}
        <div style={{ padding: "1rem 1.3rem", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: 3, height: 16, background: C.accent, borderRadius: 2 }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {language === "hi" ? "यूज़र सूची" : "User List"}
          </span>
          <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: C.muted }}>{users.length} {language === "hi" ? "यूज़र" : "users"}</span>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: C.muted, fontSize: "0.85rem" }}>{t.loading}</div>
        ) : users.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: C.muted, fontSize: "0.85rem" }}>{t.noUsers}</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fdf6ee" }}>
                {[t.colNo, t.colUser, t.colRole, t.colStatus, t.colActions].map(h => (
                  <th key={h} style={{ padding: "0.7rem 1rem", textAlign: "left", fontSize: "0.68rem", fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fdf9f4"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: C.muted, width: 40 }}>{i + 1}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}30, ${C.accent}60)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: C.accentDk, flexShrink: 0 }}>
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: C.text }}>{u.username}</p>
                        {u.name && <p style={{ margin: 0, fontSize: "0.68rem", color: C.muted }}>{u.name}</p>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}><RoleBadge role={u.role} /></td>
                  <td style={{ padding: "0.75rem 1rem" }}><StatusBadge active={u.active} locked={u.accountLocked} t={t} /></td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      <IconBtn onClick={() => { setActiveUser(u); setPanel("edit"); }} color={C.blue} bg={C.blueBg} title={t.edit}>
                        ✏️ {t.edit}
                      </IconBtn>
                      <IconBtn onClick={() => { setActiveUser(u); setPanel("reset"); }} color={C.accent} bg={C.amberBg} title={t.resetPwd}>
                        🔑 {t.resetPwd}
                      </IconBtn>
                      {auth.role === "SUPER_ADMIN" && u.accountLocked && (
                        <IconBtn onClick={() => handleUnlock(u)} color={C.green} bg={C.greenBg} title={t.unlock}>
                          🔓 {t.unlock}
                        </IconBtn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Panels ── */}
      {panel === "add" && (
        <Panel title={t.formTitle} onClose={closePanel}>
          <UserForm mode="add" allowedRoles={allowedRoles} onSave={handleAdd} onCancel={closePanel} t={t} />
        </Panel>
      )}
      {panel === "edit" && activeUser && (
        <Panel title={t.editTitle} onClose={closePanel}>
          <UserForm mode="edit" initial={activeUser} allowedRoles={allowedRoles} onSave={handleEdit} onCancel={closePanel} t={t} />
        </Panel>
      )}
      {panel === "reset" && activeUser && (
        <Panel title={t.resetTitle} onClose={closePanel}>
          <ResetForm user={activeUser} onSave={handleReset} onCancel={closePanel} t={t} />
        </Panel>
      )}
    </div>
  );
}
