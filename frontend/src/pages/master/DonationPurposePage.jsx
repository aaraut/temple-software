import { useEffect, useState } from "react";
import {
  listDonationPurposes,
  createDonationPurpose,
  updateDonationPurpose,
} from "../../api/donationPurposeApi";
import { useAuth } from "../../context/AuthContext";

// ─── Palette ──────────────────────────────────────────────────────────────────
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

// ─── Defined OUTSIDE component ────────────────────────────────────────────────
function Inp({ value, onChange, placeholder, type = "text", autoFocus, maxLength, min, max }) {
  return (
    <input
      type={type} value={value} onChange={onChange}
      placeholder={placeholder} autoFocus={autoFocus}
      maxLength={maxLength} min={min} max={max}
      style={inpStyle}
      onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}18`; e.target.style.background = "#fff"; }}
      onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; e.target.style.background = "#fdf9f4"; }}
    />
  );
}

function Field({ label, tooltip, children }) {
  const [tipVisible, setTipVisible] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
        <label style={{ fontSize: "0.68rem", fontWeight: 700, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>
        {tooltip && (
          <div style={{ position: "relative", display: "inline-flex" }}>
            <span
              onMouseEnter={() => setTipVisible(true)}
              onMouseLeave={() => setTipVisible(false)}
              style={{ width: 14, height: 14, borderRadius: "50%", background: C.accent, color: "#fff", fontSize: "0.55rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", cursor: "default", lineHeight: 1, flexShrink: 0 }}
            >i</span>
            {tipVisible && (
              <div style={{
                position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
                transform: "translateX(-50%)",
                background: "#2d1f0f", color: "#fff",
                padding: "0.45rem 0.7rem", borderRadius: 8,
                fontSize: "0.68rem", fontWeight: 500, lineHeight: 1.4,
                whiteSpace: "nowrap", zIndex: 100,
                boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                pointerEvents: "none",
              }}>
                {tooltip}
                <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #2d1f0f" }} />
              </div>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

const emptyForm = { nameHi: "", nameEn: "", fixedAmount: "", receiptPrefix: "", active: true };
const prefixRegex = /^[A-Za-z0-9]{2,4}$/;

const LANG = {
  en: {
    title: "Donation Purpose", sub: "Manage donation purpose categories",
    addTitle: "Add New Purpose", editTitle: "Editing Purpose",
    nameHi: "Name (हिंदी)", nameEn: "Name (English)",
    amount: "Fixed Amount (₹)", prefix: "Receipt Prefix",
    prefixHint: "2–4 chars, A-Z or 0-9 only (e.g. DN, VIP)",
    active: "Active", inactive: "Inactive",
    addBtn: "Add Purpose", saveBtn: "Save", cancel: "Cancel",
    search: "Search...",
    colNo: "#", colHi: "Hindi Name", colEn: "English Name",
    colPrefix: "Prefix", colAmount: "Fixed Amount",
    colStatus: "Status", colAction: "Action",
    edit: "Edit", noData: "No purposes found", loading: "Loading...",
    added: "Purpose added", updated: "Purpose updated", failed: "Failed to save",
    errRequired: "Hindi name, English name and prefix are required",
    errPrefix: "Prefix must be 2–4 alphanumeric characters (A-Z, 0-9)",
    editBanner: "Editing mode — table is locked",
    purposes: "Purposes",
  },
  hi: {
    title: "दान उद्देश्य", sub: "दान उद्देश्य श्रेणियां प्रबंधित करें",
    addTitle: "नया उद्देश्य जोड़ें", editTitle: "उद्देश्य संपादन",
    nameHi: "नाम (हिंदी)", nameEn: "नाम (अंग्रेजी)",
    amount: "निश्चित राशि (₹)", prefix: "रसीद प्रीफिक्स",
    prefixHint: "2–4 अक्षर, केवल A-Z या 0-9 (जैसे DN, VIP)",
    active: "सक्रिय", inactive: "निष्क्रिय",
    addBtn: "उद्देश्य जोड़ें", saveBtn: "सेव", cancel: "रद्द करें",
    search: "खोजें...",
    colNo: "#", colHi: "हिंदी नाम", colEn: "अंग्रेजी नाम",
    colPrefix: "प्रीफिक्स", colAmount: "निश्चित राशि",
    colStatus: "स्थिति", colAction: "कार्य",
    edit: "एडिट", noData: "कोई उद्देश्य नहीं मिला", loading: "लोड हो रहा है...",
    added: "उद्देश्य जोड़ा गया", updated: "उद्देश्य अपडेट हुआ", failed: "सहेजने में त्रुटि",
    errRequired: "हिंदी नाम, अंग्रेजी नाम और प्रीफिक्स आवश्यक हैं",
    errPrefix: "प्रीफिक्स 2–4 अक्षर/अंक होना चाहिए (A-Z, 0-9)",
    editBanner: "एडिट मोड — टेबल लॉक है",
    purposes: "उद्देश्य",
  },
};

export default function DonationPurposePage() {
  const { auth, language } = useAuth();
  const t = LANG[language] ?? LANG.en;

  const [rows,        setRows]        = useState([]);
  const [form,        setForm]        = useState(emptyForm);
  const [editingItem, setEditingItem] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState(null);
  const [search,      setSearch]      = useState("");
  const [formError,   setFormError]   = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try { setRows(await listDonationPurposes() || []); }
    catch { showToast(t.failed, "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (row) => {
    setEditingItem(row);
    setForm({
      nameHi: row.nameHi || "",
      nameEn: row.nameEn || "",
      fixedAmount: row.fixedAmount || "",
      receiptPrefix: row.receiptPrefix || "",
      active: row.active ?? true,
    });
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => { setEditingItem(null); setForm(emptyForm); setFormError(""); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setFormError("");
    if (!form.nameHi.trim() || !form.nameEn.trim() || !form.receiptPrefix.trim()) {
      setFormError(t.errRequired); return;
    }
    if (!prefixRegex.test(form.receiptPrefix)) {
      setFormError(t.errPrefix); return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        await updateDonationPurpose(editingItem.id, form, auth.username);
        showToast(t.updated);
      } else {
        await createDonationPurpose(form, auth.username);
        showToast(t.added);
      }
      cancelEdit(); setSearch(""); load();
    } catch (e) {
      showToast(e.response?.data?.message || t.failed, "error");
    } finally { setSaving(false); }
  };

  const filtered = rows.filter(r =>
    r.nameHi?.toLowerCase().includes(search.toLowerCase()) ||
    r.nameEn?.toLowerCase().includes(search.toLowerCase()) ||
    r.receiptPrefix?.toLowerCase().includes(search.toLowerCase())
  );

  const ready = form.nameHi.trim() && form.nameEn.trim() && form.receiptPrefix.trim();
  const tableDisabled = !!editingItem;

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
            🙏 {t.title}
          </h1>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: C.muted }}>{t.sub}</p>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0.5rem 0.9rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "0.6rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.purposes}</p>
          <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: C.accent, lineHeight: 1.1 }}>{rows.length}</p>
        </div>
      </div>

      {/* Form card */}
      <div style={{
        background: C.card, borderRadius: "14px",
        border: editingItem ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
        boxShadow: editingItem ? `0 4px 20px ${C.accent}20` : "0 2px 10px rgba(139,100,60,0.07)",
        marginBottom: "1.2rem", overflow: "hidden",
        transition: "border 0.2s, box-shadow 0.2s",
      }}>
        <div style={{
          padding: "0.75rem 1.2rem", borderBottom: `1px solid ${C.border}`,
          background: editingItem ? `${C.accent}12` : "#fdf9f4",
          display: "flex", alignItems: "center", gap: "0.5rem",
        }}>
          <div style={{ width: 3, height: 16, background: editingItem ? C.accent : C.green, borderRadius: 2 }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C.text }}>
            {editingItem ? `✏️ ${t.editTitle}: "${editingItem.nameHi}"` : `➕ ${t.addTitle}`}
          </span>
        </div>

        <div style={{ padding: "1rem 1.2rem" }}>
          {/* Row 1: names + prefix + amount */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "0.75rem" }}>
            <Field label={t.nameHi}>
              <Inp value={form.nameHi} autoFocus maxLength={60}
                onChange={e => set("nameHi", e.target.value)} placeholder={language === "hi" ? "जैसे संकल्प अभिषेक" : "e.g. Daan"} />
            </Field>
            <Field label={t.nameEn}>
              <Inp value={form.nameEn} maxLength={60}
                onChange={e => set("nameEn", e.target.value.replace(/[^a-zA-Z0-9\s\-]/g, ""))}
                placeholder="e.g. Daan" />
            </Field>
            <Field label={t.prefix} tooltip={t.prefixHint}>
              <div style={{ width: 110 }}>
                <Inp value={form.receiptPrefix} maxLength={4}
                  onChange={e => set("receiptPrefix", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="DN" />
              </div>
            </Field>
            <Field label={t.amount}>
              <div style={{ width: 130 }}>
                <Inp type="number" value={form.fixedAmount} min={0} max={9999999}
                  onChange={e => { const v = e.target.value; if (v === "" || (Number(v) >= 0 && Number(v) <= 9999999)) set("fixedAmount", v); }}
                  placeholder="0" />
              </div>
            </Field>
          </div>

          {/* Row 2: active toggle + buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            {/* Toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                onClick={() => set("active", !form.active)}
                style={{
                  width: 42, height: 24, borderRadius: 12, cursor: "pointer",
                  background: form.active ? C.green : "#d0c8be",
                  position: "relative", transition: "background 0.2s", flexShrink: 0,
                }}
              >
                <div style={{
                  position: "absolute", top: 3, left: form.active ? 21 : 3,
                  width: 18, height: 18, borderRadius: "50%", background: "#fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  transition: "left 0.2s",
                }} />
              </div>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: form.active ? C.green : C.muted }}>
                {form.active ? t.active : t.inactive}
              </span>
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: "0.4rem" }}>
              {editingItem && (
                <button onClick={cancelEdit} style={{
                  padding: "0.55rem 1rem", border: `1.5px solid ${C.border}`,
                  borderRadius: 8, background: "transparent", color: C.muted,
                  fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
                >{t.cancel}</button>
              )}
              <button onClick={handleSubmit} disabled={!ready || saving} style={{
                padding: "0.58rem 1.4rem", border: "none", borderRadius: 8,
                background: (!ready || saving) ? "#e8e0d8" : `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`,
                color: (!ready || saving) ? "#b0a090" : "#fff",
                fontSize: "0.82rem", fontWeight: 700,
                cursor: (!ready || saving) ? "not-allowed" : "pointer",
                fontFamily: "inherit", whiteSpace: "nowrap",
                boxShadow: (!ready || saving) ? "none" : `0 3px 10px ${C.accent}40`,
                transition: "all 0.15s",
              }}>
                {saving ? "..." : editingItem ? t.saveBtn : t.addBtn}
              </button>
            </div>
          </div>

          {/* Error */}
          {formError && (
            <div style={{ marginTop: "0.65rem", display: "flex", gap: "0.4rem", alignItems: "center", background: C.redBg, border: `1.5px solid ${C.red}`, borderRadius: 8, padding: "0.5rem 0.75rem" }}>
              <span>🚨</span>
              <span style={{ fontSize: "0.75rem", color: C.red, fontWeight: 600 }}>{formError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Table card */}
      <div style={{
        background: C.card, borderRadius: "14px", border: `1px solid ${C.border}`,
        overflow: "hidden", boxShadow: "0 2px 10px rgba(139,100,60,0.07)",
        opacity: tableDisabled ? 0.45 : 1,
        pointerEvents: tableDisabled ? "none" : "auto",
        transition: "opacity 0.25s", position: "relative",
      }}>

        {tableDisabled && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(253,249,244,0.5)", backdropFilter: "blur(1px)",
          }}>
            <div style={{ background: C.accent, color: "#fff", padding: "0.6rem 1.4rem", borderRadius: 30, fontSize: "0.8rem", fontWeight: 700, boxShadow: `0 4px 16px ${C.accent}50` }}>
              ✏️ {t.editBanner}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div style={{ padding: "0.75rem 1.2rem", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 3, height: 16, background: C.accent, borderRadius: 2 }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C.text }}>🙏 {t.purposes}</span>
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
            <div style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>🙏</div>
            <p style={{ margin: 0, color: C.muted, fontSize: "0.82rem" }}>{t.noData}</p>
          </div>
        ) : (
          <div style={{ overflowY: "auto", maxHeight: "60vh" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <tr style={{ background: "#fdf6ee" }}>
                  {[
                    { label: t.colNo,     align: "center", w: 44   },
                    { label: t.colHi,     align: "left",   w: "auto" },
                    { label: t.colEn,     align: "left",   w: "auto" },
                    { label: t.colPrefix, align: "center", w: 90   },
                    { label: t.colAmount, align: "right",  w: 120  },
                    { label: t.colStatus, align: "center", w: 90   },
                    { label: t.colAction, align: "center", w: 80   },
                  ].map(({ label, align, w }) => (
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
                {filtered.map((row, i) => {
                  const isEditing = editingItem?.id === row.id;
                  return (
                    <tr key={row.id}
                      style={{ borderBottom: `1px solid ${C.border}`, background: isEditing ? `${C.accent}0c` : "transparent", transition: "background 0.1s" }}
                      onMouseEnter={e => { if (!isEditing) e.currentTarget.style.background = "#fdf9f4"; }}
                      onMouseLeave={e => { if (!isEditing) e.currentTarget.style.background = isEditing ? `${C.accent}0c` : "transparent"; }}
                    >
                      <td style={{ padding: "0.5rem 0.9rem", textAlign: "center", fontSize: "0.7rem", color: C.muted, fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ padding: "0.5rem 0.9rem" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: isEditing ? 800 : 600, color: isEditing ? C.accentDk : C.text }}>{row.nameHi}</span>
                      </td>
                      <td style={{ padding: "0.5rem 0.9rem" }}>
                        <span style={{ fontSize: "0.82rem", color: C.muted }}>{row.nameEn}</span>
                      </td>
                      <td style={{ padding: "0.5rem 0.9rem", textAlign: "center" }}>
                        <span style={{ background: `${C.accent}15`, border: `1px solid ${C.accent}30`, borderRadius: 6, padding: "0.18rem 0.55rem", fontSize: "0.72rem", fontWeight: 800, color: C.accentDk, fontFamily: "monospace" }}>
                          {row.receiptPrefix}
                        </span>
                      </td>
                      <td style={{ padding: "0.5rem 0.9rem", textAlign: "right", fontSize: "0.83rem", fontWeight: 700, color: C.text }}>
                        {row.fixedAmount ? `₹${Number(row.fixedAmount).toLocaleString("en-IN")}` : <span style={{ color: C.muted, fontWeight: 400 }}>—</span>}
                      </td>
                      <td style={{ padding: "0.5rem 0.9rem", textAlign: "center" }}>
                        <span style={{
                          display: "inline-block", padding: "0.2rem 0.55rem", borderRadius: 20,
                          fontSize: "0.68rem", fontWeight: 700,
                          background: row.active ? C.greenBg : C.redBg,
                          color: row.active ? C.green : C.red,
                          border: `1px solid ${row.active ? C.green : C.red}30`,
                        }}>
                          {row.active ? "● " + t.active : "○ " + t.inactive}
                        </span>
                      </td>
                      <td style={{ padding: "0.5rem 0.9rem", textAlign: "center" }}>
                        <button onClick={() => startEdit(row)} style={{
                          padding: "0.3rem 0.7rem",
                          background: isEditing ? C.accent : C.blueBg,
                          color: isEditing ? "#fff" : C.blue,
                          border: `1.5px solid ${isEditing ? C.accent : `${C.blue}30`}`,
                          borderRadius: 6, fontSize: "0.7rem", fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                        }}
                          onMouseEnter={e => { if (!isEditing) { e.currentTarget.style.background = C.blue; e.currentTarget.style.color = "#fff"; } }}
                          onMouseLeave={e => { if (!isEditing) { e.currentTarget.style.background = C.blueBg; e.currentTarget.style.color = C.blue; } }}
                        >
                          {isEditing ? "✏️ ..." : `✏️ ${t.edit}`}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
