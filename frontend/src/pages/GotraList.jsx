import { useEffect, useState, useMemo } from "react";
import { listGotras, createGotra } from "../api/gotraApi";
import { useAuth } from "../context/AuthContext";

const C = {
  bg: "#fdf9f4", card: "#ffffff",
  accent: "#c8894a", accentDk: "#9a6030",
  border: "#e8ddd0", text: "#2d1f0f", muted: "#8a7560",
  green: "#2d7a2d", greenBg: "#e8f5e8",
  red: "#b03030", redBg: "#fdf0f0",
  blue: "#1a4a8a", blueBg: "#e8f0fc",
};

const inpStyle = {
  boxSizing: "border-box", width: "100%",
  padding: "0.6rem 0.85rem",
  border: `1.5px solid ${C.border}`,
  borderRadius: "9px", fontSize: "0.88rem",
  background: "#fdf9f4", color: C.text,
  fontFamily: "inherit", outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

// Defined outside — no remount on parent re-render
function Inp({ value, onChange, placeholder, autoFocus, maxLength }) {
  return (
    <input
      value={value} onChange={onChange} placeholder={placeholder}
      autoFocus={autoFocus} maxLength={maxLength}
      style={inpStyle}
      onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}18`; e.target.style.background = "#fff"; }}
      onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; e.target.style.background = "#fdf9f4"; }}
    />
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1 }}>
      <label style={{ fontSize: "0.68rem", fontWeight: 700, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>
      {children}
    </div>
  );
}

const L = {
  en: {
    title: "Gotra Management", sub: "Manage gotras in Hindi & English",
    addTitle: "Add New Gotra", editTitle: "Editing Gotra",
    labelHi: "Gotra (हिंदी)", labelEn: "Gotra (English)",
    phHi: "e.g. कश्यप", phEn: "e.g. Kashyap",
    addBtn: "Add Gotra", saveBtn: "Save", cancel: "Cancel",
    search: "Search gotras...",
    colNo: "#", colHi: "Hindi Name", colEn: "English Name", colAction: "Action",
    edit: "Edit", noData: "No gotras found", loading: "Loading...",
    added: "Gotra added", updated: "Gotra updated", failed: "Failed to save",
    errBoth: "Both Hindi and English names are required",
    dupTitle: "Similar Gotra Found",
    dupSub: "A gotra with a similar name already exists. What would you like to do?",
    dupAddNew: "Add as new gotra",
    dupEdit: "Edit existing",
    editBanner: "Editing mode — table is locked",
    items: "Gotras",
  },
  hi: {
    title: "गोत्र प्रबंधन", sub: "गोत्र को हिंदी और अंग्रेजी में प्रबंधित करें",
    addTitle: "नया गोत्र जोड़ें", editTitle: "गोत्र संपादन",
    labelHi: "गोत्र (हिंदी)", labelEn: "गोत्र (अंग्रेजी)",
    phHi: "जैसे कश्यप", phEn: "जैसे Kashyap",
    addBtn: "गोत्र जोड़ें", saveBtn: "सेव", cancel: "रद्द करें",
    search: "गोत्र खोजें...",
    colNo: "#", colHi: "हिंदी नाम", colEn: "अंग्रेजी नाम", colAction: "कार्य",
    edit: "एडिट", noData: "कोई गोत्र नहीं मिला", loading: "लोड हो रहा है...",
    added: "गोत्र जोड़ा गया", updated: "गोत्र अपडेट हुआ", failed: "गोत्र सहेजने में त्रुटि",
    errBoth: "हिंदी और अंग्रेजी दोनों नाम भरना आवश्यक है",
    dupTitle: "मिलता-जुलता गोत्र मिला",
    dupSub: "इस नाम से मिलते-जुलते गोत्र पहले से मौजूद हैं। आप क्या करना चाहते हैं?",
    dupAddNew: "नया गोत्र जोड़ें",
    dupEdit: "मौजूदा एडिट करें",
    editBanner: "एडिट मोड — टेबल लॉक है",
    items: "गोत्र",
  },
};

const emptyForm = { id: null, gotraNameHi: "", gotraNameEn: "" };

export default function GotraList() {
  const { auth, language } = useAuth();
  const t = L[language] ?? L.en;
  const isAdmin = auth?.role === "ADMIN" || auth?.role === "SUPER_ADMIN";

  const [gotras,      setGotras]      = useState([]);
  const [form,        setForm]        = useState(emptyForm);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState(null);
  const [search,      setSearch]      = useState("");
  const [showDup, setShowDup] = useState(false);
  const [formError,   setFormError]   = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try { setGotras(await listGotras()); }
    catch { showToast(t.failed, "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Word-token similarity — same logic as inventory
  const tokenise = (str) =>
    str.toLowerCase().trim()
      .split(/[\s\(\)\-\/,]+/)
      .map(w => w.trim())
      .filter(w => w.length >= 2);

  const similarGotras = useMemo(() => {
    if (!form.gotraNameHi.trim() && !form.gotraNameEn.trim()) return [];
    const hiTokens = tokenise(form.gotraNameHi);
    const enTokens = tokenise(form.gotraNameEn);
    const allQueryTokens = [...hiTokens, ...enTokens];
    if (allQueryTokens.length === 0) return [];

    return gotras.filter(g => {
      const gHiTokens = tokenise(g.hindiName || "");
      const gEnTokens = tokenise(g.englishName || "");
      const allItemTokens = [...gHiTokens, ...gEnTokens];
      return allQueryTokens.some(qt =>
        allItemTokens.some(it => it.includes(qt) || qt.includes(it))
      );
    });
  }, [form.gotraNameHi, form.gotraNameEn, gotras]);

  const doSave = async () => {
    setShowDup(false);
    setSaving(true);
    try {
      await createGotra({ gotraNameHi: form.gotraNameHi, gotraNameEn: form.gotraNameEn });
      showToast(t.added);
      setForm(emptyForm); setFormError(""); setSearch(""); load();
    } catch (e) {
      showToast(e.response?.data?.message || t.failed, "error");
    } finally { setSaving(false); }
  };

  const handleSubmit = () => {
    setFormError("");
    if (!form.gotraNameHi.trim() || !form.gotraNameEn.trim()) {
      setFormError(t.errBoth);
      return;
    }
    if (similarGotras.length > 0) {
      setShowDup(true);
      return;
    }
    doSave();
  };

  const filtered = useMemo(() =>
    gotras.filter(g =>
      g.hindiName?.toLowerCase().includes(search.toLowerCase()) ||
      g.englishName?.toLowerCase().includes(search.toLowerCase())
    ), [gotras, search]
  );

  const ready = form.gotraNameHi.trim() && form.gotraNameEn.trim();
  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "1.2rem 1.5rem", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "1.2rem", right: "1.2rem", zIndex: 999,
          background: toast.type === "error" ? C.red : C.green,
          color: "#fff", padding: "0.65rem 1.1rem", borderRadius: 10,
          fontSize: "0.82rem", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}>
          {toast.type === "error" ? "⚠️" : "✓"} {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.2rem" }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.62rem", fontWeight: 700, color: C.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            {language === "hi" ? "मास्टर" : "Master"}
          </p>
          <h1 style={{ margin: "0.1rem 0 0", fontSize: "1.3rem", fontWeight: 800, color: C.text, lineHeight: 1 }}>
            🌳 {t.title}
          </h1>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: C.muted }}>{t.sub}</p>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0.5rem 0.9rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "0.6rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.items}</p>
          <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: C.accent, lineHeight: 1.1 }}>{gotras.length}</p>
        </div>
      </div>

      {/* Form card — only for admins */}
      {isAdmin && (
        <div style={{
          background: C.card, borderRadius: "14px",
          border: `1px solid ${C.border}`,
          boxShadow: "0 2px 10px rgba(139,100,60,0.07)",
          marginBottom: "1.2rem", overflow: "hidden",
        }}>
          <div style={{
            padding: "0.75rem 1.2rem", borderBottom: `1px solid ${C.border}`,
            background: "#fdf9f4",
            display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <div style={{ width: 3, height: 16, background: C.green, borderRadius: 2 }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C.text }}>
  {`➕ ${t.addTitle}`}
            </span>
          </div>

          <div style={{ padding: "1rem 1.2rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <Field label={t.labelHi}>
                <Inp value={form.gotraNameHi} autoFocus maxLength={50}
                  onChange={e => set("gotraNameHi", e.target.value)} placeholder={t.phHi} />
              </Field>
              <Field label={t.labelEn}>
                <Inp value={form.gotraNameEn} maxLength={50}
                  onChange={e => set("gotraNameEn", e.target.value.replace(/[^a-zA-Z\s]/g, ""))} placeholder={t.phEn} />
              </Field>
              <div style={{ display: "flex", gap: "0.4rem", paddingBottom: "0.05rem", flexShrink: 0 }}>
                <button onClick={handleSubmit} disabled={!ready || saving} style={{
                  padding: "0.58rem 1.2rem", border: "none", borderRadius: 8,
                  background: (!ready || saving) ? "#e8e0d8" : `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`,
                  color: (!ready || saving) ? "#b0a090" : "#fff",
                  fontSize: "0.82rem", fontWeight: 700,
                  cursor: (!ready || saving) ? "not-allowed" : "pointer",
                  fontFamily: "inherit", whiteSpace: "nowrap",
                  boxShadow: (!ready || saving) ? "none" : `0 3px 10px ${C.accent}40`,
                  transition: "all 0.15s",
                }}>
                  {saving ? "..." : t.addBtn}
                </button>

              </div>
            </div>
            {formError && (
              <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.4rem", alignItems: "center", background: C.redBg, border: `1.5px solid ${C.red}`, borderRadius: 8, padding: "0.5rem 0.75rem" }}>
                <span>🚨</span>
                <span style={{ fontSize: "0.75rem", color: C.red, fontWeight: 600 }}>{formError}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table card */}
      <div style={{
        background: C.card, borderRadius: "14px", border: `1px solid ${C.border}`,
        overflow: "hidden", boxShadow: "0 2px 10px rgba(139,100,60,0.07)",
        overflow: "hidden",
      }}>



        {/* Toolbar */}
        <div style={{ padding: "0.75rem 1.2rem", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 3, height: 16, background: C.accent, borderRadius: 2 }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C.text }}>🌳 {t.items}</span>
            <span style={{ background: `${C.accent}20`, border: `1px solid ${C.accent}40`, borderRadius: 20, padding: "0.1rem 0.55rem", fontSize: "0.65rem", fontWeight: 800, color: C.accent }}>
              {filtered.length}
            </span>
          </div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: C.muted, pointerEvents: "none" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search}
              style={{ ...inpStyle, width: 200, paddingLeft: "1.8rem", fontSize: "0.8rem" }}
              onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}18`; e.target.style.background = "#fff"; }}
              onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; e.target.style.background = "#fdf9f4"; }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: C.muted, fontSize: "0.82rem" }}>{t.loading}</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>🌳</div>
            <p style={{ margin: 0, color: C.muted, fontSize: "0.82rem" }}>{t.noData}</p>
          </div>
        ) : (
          <div style={{ overflowY: "auto", maxHeight: "60vh" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <tr style={{ background: "#fdf6ee" }}>
                  {[
                    { label: t.colNo,     w: 48,     align: "center" },
                    { label: t.colHi,     w: "auto", align: "left"   },
                    { label: t.colEn,     w: "auto", align: "left"   },
                  ].map(({ label, w, align }) => (
                    <th key={label} style={{
                      padding: "0.55rem 0.9rem", textAlign: align,
                      fontSize: "0.65rem", fontWeight: 700, color: C.muted,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      borderBottom: `2px solid ${C.border}`, background: "#fdf6ee",
                      width: w !== "auto" ? w : undefined,
                    }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((g, i) => {
                  return (
                    <tr key={g.id}
style={{ borderBottom: `1px solid ${C.border}`, background: "transparent", transition: "background 0.1s" }}
onMouseEnter={e => e.currentTarget.style.background = "#fdf9f4"}
onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "0.55rem 0.9rem", textAlign: "center", fontSize: "0.7rem", color: C.muted, fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ padding: "0.55rem 0.9rem" }}>
<span style={{ fontSize: "0.85rem", fontWeight: 600, color: C.text }}>{g.hindiName}</span>
                      </td>
                      <td style={{ padding: "0.55rem 0.9rem" }}>
                        <span style={{ fontSize: "0.82rem", color: C.muted, fontWeight: 500 }}>{g.englishName}</span>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Duplicate modal */}
      {showDup && (
        <>
          <div onClick={() => setShowDup(false)} style={{
            position: "fixed", inset: 0, background: "rgba(45,31,15,0.45)",
            zIndex: 200, backdropFilter: "blur(3px)",
          }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 201, width: "min(480px, 92vw)",
            background: "#fff", borderRadius: "20px",
            boxShadow: "0 20px 60px rgba(45,31,15,0.25)",
            overflow: "hidden",
            animation: "fadeUp 0.2s ease-out",
          }}>
            <style>{`@keyframes fadeUp { from { opacity:0; transform:translate(-50%,-45%); } to { opacity:1; transform:translate(-50%,-50%); } }`}</style>
            <div style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`, padding: "1.2rem 1.4rem" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "0.4rem" }}>🔍</div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#fff" }}>{t.dupTitle}</h3>
              <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "#fff9", lineHeight: 1.4 }}>{t.dupSub}</p>
            </div>

            <div style={{ padding: "1rem 1.2rem", maxHeight: 260, overflowY: "auto" }}>
<p style={{ margin: "0 0 0.7rem", fontSize: "0.68rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{language === "hi" ? "मौजूदा गोत्र" : "Existing Gotras"}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {similarGotras.map(g => (
                  <div key={g.id} style={{
                    padding: "0.75rem 1rem", background: "#fdf9f4",
                    border: `1.5px solid ${C.border}`, borderRadius: "12px",
                  }}>
                    <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: C.text }}>{g.hindiName}</p>
                    <p style={{ margin: "0.1rem 0 0", fontSize: "0.72rem", color: C.muted }}>{g.englishName}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              padding: "0.9rem 1.2rem", borderTop: `1px solid ${C.border}`,
              display: "flex", gap: "0.6rem", justifyContent: "flex-end",
              background: "#fdf9f4",
            }}>
              <button onClick={() => setShowDup(false)} style={{
                padding: "0.55rem 1.1rem", background: "transparent",
                border: `1.5px solid ${C.border}`, borderRadius: 9,
                color: C.muted, fontSize: "0.8rem", fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.muted}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >✕ {t.cancel}</button>
              <button onClick={doSave} style={{
                padding: "0.55rem 1.2rem", background: "#fff", color: C.accentDk,
                border: `1.5px solid ${C.accent}`, borderRadius: 9,
                fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = `${C.accent}12`; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
              >➕ {t.dupAddNew}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
