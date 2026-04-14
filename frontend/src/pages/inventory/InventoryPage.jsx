import { useEffect, useState, useMemo } from "react";
import { getInventoryItems, createInventoryItem, updateInventoryItem } from "../../api/inventoryApi";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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
  padding: "0.55rem 0.75rem",
  border: `1.5px solid ${C.border}`,
  borderRadius: "8px", fontSize: "0.85rem",
  background: "#fdf9f4", color: C.text,
  fontFamily: "inherit", outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

// Defined outside component — prevents remount on each keystroke
function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.28rem", flex: 1 }}>
      <label style={{ fontSize: "0.68rem", fontWeight: 700, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

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

const L = {
  en: {
    BARTAN: "Bartan Inventory", BICHAYAT: "Bichayat Inventory",
    addTitle: "Add New Item", editTitle: "Editing",
    name: "Material Name", unit: "Unit", rate: "Rate (₹)", stock: "Stock",
    addBtn: "Add Item", updateBtn: "Save", cancel: "Cancel",
    search: "Search...", listTitle: "Items",
    colNo: "#", colName: "Name", colUnit: "Unit", colRate: "Rate",
    colStock: "Stock", colAction: "Action",
    edit: "Edit", noItems: "No items found", loading: "Loading...",
    added: "Item added", updated: "Item updated", failed: "Failed to save",
    dupWarn: "Similar items found",
    dupSub: "We found existing items with a similar name. What would you like to do?",
    dupAddNew: "Add as new item anyway",
    dupSelect: "Update existing",
    dupQty: "Stock",
    dupRate: "Rate",
    editBanner: "Editing mode — table is locked",
  },
  hi: {
    BARTAN: "बर्तन सूची", BICHAYAT: "बिछायत सूची",
    addTitle: "नई सामग्री जोड़ें", editTitle: "संपादन",
    name: "सामग्री का नाम", unit: "इकाई", rate: "दर (₹)", stock: "स्टॉक",
    addBtn: "जोड़ें", updateBtn: "सेव", cancel: "रद्द करें",
    search: "खोजें...", listTitle: "सामग्री",
    colNo: "#", colName: "नाम", colUnit: "इकाई", colRate: "दर",
    colStock: "स्टॉक", colAction: "कार्य",
    edit: "एडिट", noItems: "कोई सामग्री नहीं मिली", loading: "लोड हो रहा है...",
    added: "सामग्री जोड़ी गई", updated: "सामग्री अपडेट हुई", failed: "सामग्री सहेजने में त्रुटि",
    dupWarn: "मिलती-जुलती सामग्री मिली",
    dupSub: "इस नाम की सामग्री पहले से मौजूद है। आप क्या करना चाहते हैं?",
    dupAddNew: "नई एंट्री जोड़ें",
    dupSelect: "मौजूदा अपडेट करें",
    dupQty: "स्टॉक",
    dupRate: "दर",
    editBanner: "एडिट मोड — टेबल लॉक है",
  },
};

const emptyForm = { id: null, materialNameHi: "", unit: "NOS", rate: "", totalStock: "" };

export default function InventoryPage() {
  const location = useLocation();
  const { language } = useAuth();
  const t = L[language] ?? L.en;
  const CATEGORY = location.pathname.includes("bichayat") ? "BICHAYAT" : "BARTAN";
  const icon = CATEGORY === "BICHAYAT" ? "🛋️" : "🍳";

  const [items,       setItems]       = useState([]);
  const [form,        setForm]        = useState(emptyForm);
  const [editingItem, setEditingItem] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState(null);
  const [search,      setSearch]      = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try { setItems(await getInventoryItems(CATEGORY)); }
    finally { setLoading(false); }
  };

  useEffect(() => { setEditingItem(null); setForm(emptyForm); load(); }, [CATEGORY]);

  const startEdit = (item) => { setEditingItem(item); setForm(item); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const cancelEdit = () => { setEditingItem(null); setForm(emptyForm); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Check for duplicate name (case-insensitive) among existing items excluding the one being edited
  const similarItems = useMemo(() => {
    if (editingItem || !form.materialNameHi.trim()) return [];

    // Tokenise: split on spaces/parens/hyphens/commas, keep words >= 2 chars
    const tokenise = (str) =>
      str.toLowerCase().trim()
        .split(/[\s\(\)\-\/,]+/)
        .map(w => w.trim())
        .filter(w => w.length >= 2);

    const queryTokens = tokenise(form.materialNameHi);
    if (queryTokens.length === 0) return [];

    return items.filter(item => {
      if (!item.materialNameHi) return false;
      const itemTokens = tokenise(item.materialNameHi);
      // Match if ANY query token partially matches ANY item token (or vice versa)
      return queryTokens.some(qt =>
        itemTokens.some(it => it.includes(qt) || qt.includes(it))
      );
    });
  }, [form.materialNameHi, items, editingItem]);

  const [showDupModal, setShowDupModal] = useState(false);

  const doSave = async () => {
    setShowDupModal(false);
    setSaving(true);
    try {
      if (form.id) {
        await updateInventoryItem(form.id, { ...form, category: CATEGORY });
        showToast(t.updated);
      } else {
        await createInventoryItem({ ...form, category: CATEGORY });
        showToast(t.added);
      }
      cancelEdit(); setSearch(""); load();
    } catch (e) {
      showToast(e.response?.data?.message || t.failed, "error");
    } finally { setSaving(false); }
  };

  const handleSubmit = () => {
    if (!form.materialNameHi.trim()) return;
    // If adding new and similar items exist, show confirmation modal
    if (!form.id && similarItems.length > 0) {
      setShowDupModal(true);
      return;
    }
    doSave();
  };

  const selectExisting = (item) => {
    setShowDupModal(false);
    startEdit(item);
  };

  const filtered = useMemo(() =>
    items.filter(i => i.materialNameHi?.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  const ready = form.materialNameHi.trim() && form.unit.trim();
  const tableDisabled = !!editingItem;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "1.2rem 1.5rem", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "1.2rem", right: "1.2rem", zIndex: 999,
          background: toast.type === "error" ? C.red : C.green,
          color: "#fff", padding: "0.65rem 1.1rem", borderRadius: 10,
          fontSize: "0.82rem", fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}>
          {toast.type === "error" ? "⚠️" : "✓"} {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.2rem" }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.62rem", fontWeight: 700, color: C.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            {language === "hi" ? "इन्वेंट्री" : "Inventory"}
          </p>
          <h1 style={{ margin: "0.1rem 0 0", fontSize: "1.3rem", fontWeight: 800, color: C.text, lineHeight: 1 }}>
            {icon} {t[CATEGORY]}
          </h1>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          {[
            { label: language === "hi" ? "आइटम" : "Items",  value: items.length,                                                      color: C.accent },
            { label: language === "hi" ? "स्टॉक"  : "Stock", value: items.reduce((s, i) => s + (Number(i.totalStock) || 0), 0), color: C.green  },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0.5rem 0.9rem", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "0.6rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
              <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color, lineHeight: 1.1 }}>{value}</p>
            </div>
          ))}
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
            {editingItem ? `✏️ ${t.editTitle}: "${editingItem.materialNameHi}"` : `➕ ${t.addTitle}`}
          </span>
        </div>

        <div style={{ padding: "1rem 1.2rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <Field label={t.name}>
              <div style={{ minWidth: 200, flex: 2 }}>
                <Inp value={form.materialNameHi} autoFocus maxLength={80}
                  onChange={e => set("materialNameHi", e.target.value)} placeholder={t.name} />
              </div>
            </Field>
            <Field label={t.unit}>
              <div style={{ width: 80 }}>
                <Inp value={form.unit} maxLength={10}
                  onChange={e => set("unit", e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())} placeholder="NOS" />
              </div>
            </Field>
            <Field label={t.rate}>
              <div style={{ width: 100 }}>
                <Inp type="number" value={form.rate} min={0} max={999999}
                  onChange={e => { const v = e.target.value; if (v === "" || (Number(v) >= 0 && Number(v) <= 999999 && !v.includes("."))) set("rate", v); }} placeholder="0" />
              </div>
            </Field>
            <Field label={t.stock}>
              <div style={{ width: 100 }}>
                <Inp type="number" value={form.totalStock} min={0} max={99999}
                  onChange={e => { const v = e.target.value; if (v === "" || (Number(v) >= 0 && Number(v) <= 99999 && !v.includes("."))) set("totalStock", v); }} placeholder="0" />
              </div>
            </Field>
            <div style={{ display: "flex", gap: "0.4rem", paddingBottom: "0.05rem" }}>
              <button onClick={handleSubmit} disabled={!ready || saving} style={{
                padding: "0.58rem 1.2rem", border: "none", borderRadius: 8,
                background: (!ready || saving) ? "#e8e0d8" : `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`,
                color: (!ready || saving) ? "#b0a090" : "#fff",
                fontSize: "0.82rem", fontWeight: 700,
                cursor: (!ready || saving) ? "not-allowed" : "pointer",
                fontFamily: "inherit", boxShadow: (!ready || saving) ? "none" : `0 3px 10px ${C.accent}40`,
                transition: "all 0.15s", whiteSpace: "nowrap",
              }}>
                {saving ? "..." : editingItem ? t.updateBtn : t.addBtn}
              </button>
              {editingItem && (
                <button onClick={cancelEdit} style={{
                  padding: "0.55rem 1rem", border: `1.5px solid ${C.border}`,
                  borderRadius: 8, background: "transparent", color: C.muted,
                  fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
                >
                  {t.cancel}
                </button>
              )}
            </div>
          </div>


        </div>
      </div>

      {/* Table card */}
      <div style={{
        background: C.card, borderRadius: "14px", border: `1px solid ${C.border}`,
        overflow: "hidden", boxShadow: "0 2px 10px rgba(139,100,60,0.07)",
        opacity: tableDisabled ? 0.45 : 1,
        pointerEvents: tableDisabled ? "none" : "auto",
        transition: "opacity 0.25s",
        position: "relative",
      }}>

        {/* Disabled overlay banner */}
        {tableDisabled && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(253,249,244,0.5)", backdropFilter: "blur(1px)",
          }}>
            <div style={{ background: C.accent, color: "#fff", padding: "0.6rem 1.4rem", borderRadius: 30, fontSize: "0.8rem", fontWeight: 700, boxShadow: `0 4px 16px ${C.accent}50` }}>
              ✏️ {t.editBanner}
            </div>
          </div>
        )}

        {/* Table toolbar */}
        <div style={{ padding: "0.75rem 1.2rem", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 3, height: 16, background: C.accent, borderRadius: 2 }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C.text }}>{t.listTitle}</span>
            <span style={{ background: `${C.accent}20`, border: `1px solid ${C.accent}40`, borderRadius: 20, padding: "0.1rem 0.55rem", fontSize: "0.65rem", fontWeight: 800, color: C.accent }}>
              {filtered.length}
            </span>
          </div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: C.muted, pointerEvents: "none" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search}
              style={{ ...inpStyle, width: 180, paddingLeft: "1.8rem", fontSize: "0.8rem" }}
              onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}18`; e.target.style.background = "#fff"; }}
              onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; e.target.style.background = "#fdf9f4"; }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: C.muted, fontSize: "0.82rem" }}>{t.loading}</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>📦</div>
            <p style={{ margin: 0, color: C.muted, fontSize: "0.82rem" }}>{t.noItems}</p>
          </div>
        ) : (
          <div style={{ overflowY: "auto", maxHeight: "60vh" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <tr style={{ background: "#fdf6ee" }}>
                  {[
                    { label: t.colNo,     align: "center", w: 40  },
                    { label: t.colName,   align: "left",   w: "auto" },
                    { label: t.colUnit,   align: "center", w: 70  },
                    { label: t.colRate,   align: "right",  w: 90  },
                    { label: t.colStock,  align: "right",  w: 80  },
                    { label: t.colAction, align: "center", w: 80  },
                  ].map(({ label, align, w }) => (
                    <th key={label} style={{
                      padding: "0.55rem 0.75rem", textAlign: align,
                      fontSize: "0.65rem", fontWeight: 700, color: C.muted,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      borderBottom: `2px solid ${C.border}`,
                      width: w !== "auto" ? w : undefined, background: "#fdf6ee",
                    }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const isEditing = editingItem?.id === item.id;
                  return (
                    <tr key={item.id}
                      style={{
                        borderBottom: `1px solid ${C.border}`,
                        background: isEditing ? `${C.accent}12` : "transparent",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={e => { if (!isEditing) e.currentTarget.style.background = "#fdf9f4"; }}
                      onMouseLeave={e => { if (!isEditing) e.currentTarget.style.background = "transparent"; }}
                    >
                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "center", fontSize: "0.7rem", color: C.muted, fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>
                        <span style={{ fontSize: "0.83rem", fontWeight: isEditing ? 800 : 600, color: isEditing ? C.accentDk : C.text }}>
                          {item.materialNameHi}
                        </span>
                      </td>
                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "center" }}>
                        <span style={{ background: `${C.accent}15`, border: `1px solid ${C.accent}30`, borderRadius: 5, padding: "0.15rem 0.45rem", fontSize: "0.68rem", fontWeight: 700, color: C.accentDk }}>
                          {item.unit}
                        </span>
                      </td>
                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontSize: "0.83rem", fontWeight: 700, color: C.text }}>
                        ₹{Number(item.rate || 0).toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontSize: "0.83rem", fontWeight: 700, color: C.text }}>
                        {item.totalStock}
                      </td>
                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "center" }}>
                        <button onClick={() => startEdit(item)} style={{
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

      {/* ── Duplicate Items Modal ── */}
      {showDupModal && (
        <>
          {/* Backdrop */}
          <div onClick={() => setShowDupModal(false)} style={{
            position: "fixed", inset: 0, background: "rgba(45,31,15,0.45)",
            zIndex: 200, backdropFilter: "blur(3px)",
          }} />

          {/* Modal card */}
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 201, width: "min(500px, 92vw)",
            background: "#fff", borderRadius: "20px",
            boxShadow: "0 20px 60px rgba(45,31,15,0.25)",
            overflow: "hidden",
            animation: "fadeUp 0.2s ease-out",
          }}>
            <style>{`@keyframes fadeUp { from { opacity:0; transform:translate(-50%,-45%); } to { opacity:1; transform:translate(-50%,-50%); } }`}</style>

            {/* Modal header */}
            <div style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`, padding: "1.2rem 1.4rem" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "0.4rem" }}>🔍</div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#fff" }}>{t.dupWarn}</h3>
              <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "#fff9", lineHeight: 1.4 }}>{t.dupSub}</p>
            </div>

            {/* Similar items list */}
            <div style={{ padding: "1rem 1.2rem", maxHeight: 280, overflowY: "auto" }}>
              <p style={{ margin: "0 0 0.7rem", fontSize: "0.7rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {t.dupSelect}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {similarItems.map(item => (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    background: "#fdf9f4", border: `1.5px solid ${C.border}`,
                    borderRadius: "12px", gap: "1rem",
                    transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = `${C.accent}0a`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = "#fdf9f4"; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: C.text }}>{item.materialNameHi}</p>
                      <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.2rem" }}>
                        <span style={{ fontSize: "0.72rem", color: C.muted }}>
                          {t.dupQty}: <strong style={{ color: C.text }}>{item.totalStock} {item.unit}</strong>
                        </span>
                        <span style={{ fontSize: "0.72rem", color: C.muted }}>
                          {t.dupRate}: <strong style={{ color: C.text }}>₹{Number(item.rate||0).toLocaleString("en-IN")}</strong>
                        </span>
                      </div>
                    </div>
                    <button onClick={() => selectExisting(item)} style={{
                      padding: "0.45rem 1rem", flexShrink: 0,
                      background: `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`,
                      color: "#fff", border: "none", borderRadius: 8,
                      fontSize: "0.75rem", fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                      boxShadow: `0 2px 8px ${C.accent}40`,
                    }}>
                      ✏️ {t.edit}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer actions */}
            <div style={{
              padding: "0.9rem 1.2rem", borderTop: `1px solid ${C.border}`,
              display: "flex", gap: "0.6rem", justifyContent: "flex-end",
              background: "#fdf9f4",
            }}>
              <button onClick={() => setShowDupModal(false)} style={{
                padding: "0.55rem 1.1rem", background: "transparent",
                border: `1.5px solid ${C.border}`, borderRadius: 9,
                color: C.muted, fontSize: "0.8rem", fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.muted; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
              >
                ✕ {language === "hi" ? "रद्द करें" : "Cancel"}
              </button>
              <button onClick={doSave} style={{
                padding: "0.55rem 1.2rem",
                background: "#fff", color: C.accentDk,
                border: `1.5px solid ${C.accent}`,
                borderRadius: 9, fontSize: "0.8rem", fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = `${C.accent}12`; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
              >
                ➕ {t.dupAddNew}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
