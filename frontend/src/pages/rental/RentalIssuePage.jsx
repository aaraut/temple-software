import { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { createRentalAndPrint } from "../../api/rentalApi";
import { getInventoryItems } from "../../api/inventoryApi";
import { searchDonorByMobile } from "../../api/rentalApi";
import { useAuth } from "../../context/AuthContext";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#fdf9f4", card: "#ffffff",
  accent: "#c8894a", accentDk: "#9a6030",
  border: "#e8ddd0", text: "#2d1f0f", muted: "#8a7560",
  green: "#2d7a2d", greenBg: "#e8f5e8",
  red: "#b03030", redBg: "#fdf0f0",
  blue: "#1a4a8a", blueBg: "#e8f0fc",
  yellow: "#b07800", yellowBg: "#fffbe6",
};

const inp = (extra = {}) => ({
  boxSizing: "border-box", width: "100%",
  padding: "0.62rem 0.85rem",
  border: `1.5px solid ${C.border}`,
  borderRadius: "9px", fontSize: "0.88rem",
  background: "#fdf9f4", color: C.text,
  fontFamily: "inherit", outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  ...extra,
});

// ─── All defined OUTSIDE to prevent remount ───────────────────────────────────
function Inp({ value, onChange, onBlur, placeholder, type = "text", maxLength, min, max, disabled, suffix }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} maxLength={maxLength} min={min} max={max}
        disabled={disabled}
        style={{
          ...inp({ paddingRight: suffix ? "2.5rem" : undefined }),
          ...(focused && !disabled ? { borderColor: C.accent, boxShadow: `0 0 0 3px ${C.accent}18`, background: "#fff" } : {}),
          ...(disabled ? { background: "#f5f0ea", color: C.muted, cursor: "not-allowed" } : {}),
        }}
        onFocus={() => setFocused(true)}
        onBlur={e => { setFocused(false); onBlur && onBlur(e); }}
      />
      {suffix && <span style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: C.muted, pointerEvents: "none" }}>{suffix}</span>}
    </div>
  );
}

function Field({ label, children, note }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.28rem" }}>
      <label style={{ fontSize: "0.68rem", fontWeight: 700, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>
      {children}
      {note && <span style={{ fontSize: "0.62rem", color: C.green, fontWeight: 600 }}>{note}</span>}
    </div>
  );
}

const L = {
  hi: {
    titleBartan: "बर्तन किराया", titleBichayat: "बिछायत किराया",
    customerSec: "ग्राहक विवरण",
    name: "नाम", mobile: "मोबाइल नंबर", address: "पता",
    itemsSec: "सामान सूची",
    colItem: "सामान", colQty: "मात्रा", colRate: "दर", colTotal: "योग",
    addItem: "+ सामान जोड़ें",
    amountSec: "राशि विवरण",
    calcTotal: "कुल योग (गणना)", charged: "देय राशि", deposit: "जमानत राशि",
    saveBtn: "सेव और प्रिंट करें", resetBtn: "रद्द करें",
    autoFilled: "✔ पिछले रिकॉर्ड से भरा गया",
    searching: "खोज रहे हैं...",
    selectItem: "-- सामान चुनें --",
    available: "उपलब्ध",
    confirmTitle: "क्या आप सहेजना चाहते हैं?",
    confirmSub: "कृपया विवरण जांचें और पुष्टि करें",
    confirmSave: "हाँ, सेव करें",
    confirmCancel: "वापस जाएं",
    totalLabel: "कुल राशि", depositLabel: "जमानत",
    errMinItem: "कम से कम एक सामान जोड़ें",
    errSelectItem: "सभी पंक्तियों में सामान चुनें",
    loading: "इन्वेंट्री लोड हो रही है...",
    success: "किराया सफलतापूर्वक दर्ज हुआ और रसीद प्रिंट हो रही है।",
    error: "किराया दर्ज करने में त्रुटि",
    errOutOfStock: (name) => `❌ स्टॉक में नहीं: "${name}" — कृपया मात्रा कम करें या अन्य सामान चुनें`,
    errCategoryMismatch: "❌ गलत श्रेणी का सामान चुना गया — सही सामान चुनें",
  },
  en: {
    titleBartan: "Bartan Rental", titleBichayat: "Bichayat Rental",
    customerSec: "Customer Details",
    name: "Name", mobile: "Mobile Number", address: "Address",
    itemsSec: "Items List",
    colItem: "Item", colQty: "Qty", colRate: "Rate", colTotal: "Total",
    addItem: "+ Add Item",
    amountSec: "Amount Details",
    calcTotal: "Calculated Total", charged: "Charged Amount", deposit: "Security Deposit",
    saveBtn: "Save & Print", resetBtn: "Reset",
    autoFilled: "✔ Auto-filled from previous record",
    searching: "Searching...",
    selectItem: "-- Select Item --",
    available: "Avail",
    confirmTitle: "Ready to save?",
    confirmSub: "Please review the details before confirming",
    confirmSave: "Yes, Save & Print",
    confirmCancel: "Go Back",
    totalLabel: "Total Amount", depositLabel: "Deposit",
    errMinItem: "Add at least one item",
    errSelectItem: "Please select item in all rows",
    loading: "Loading inventory...",
    success: "Rental created and receipt is printing.",
    error: "Failed to create rental",
    errOutOfStock: (name) => `❌ Out of stock: "${name}" — Please reduce quantity or choose another item`,
    errCategoryMismatch: "❌ Wrong category item selected — please choose correct item",
  },
};

const emptyCustomer = { customerName: "", mobile: "", address: "", aadhaar: "000" };
const emptyItem = () => ({ inventoryItemId: "", quantity: 1, rate: 0 });

export default function RentalIssuePage() {
  const { auth, language } = useAuth();
  const location = useLocation();
  const t = L[language] ?? L.hi;

  const category = location.pathname.includes("bichayat") ? "BICHAYAT" : "BARTAN";
  const catIcon  = category === "BICHAYAT" ? "🛋️" : "🍳";

  const [inventory,    setInventory]    = useState([]);
  const [invLoading,   setInvLoading]   = useState(false);
  const [customer,     setCustomer]     = useState(emptyCustomer);
  const [items,        setItems]        = useState([emptyItem()]);
  const [depositAmt,   setDepositAmt]   = useState("");
  const [chargedAmt,   setChargedAmt]   = useState("");
  const [autoFilled,   setAutoFilled]   = useState(false);
  const [searching,    setSearching]    = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState(null);
  const [formError,    setFormError]    = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    // Errors stay longer so user can read the item name
    setTimeout(() => setToast(null), type === "error" ? 8000 : 5000);
  };

  const reset = () => {
    setCustomer(emptyCustomer);
    setItems([emptyItem()]);
    setDepositAmt(""); setChargedAmt("");
    setAutoFilled(false); setFormError("");
  };

  useEffect(() => { reset(); }, [category]);

  useEffect(() => {
    setInvLoading(true);
    getInventoryItems(category)
      .then(d => setInventory(d || []))
      .catch(() => showToast(t.error, "error"))
      .finally(() => setInvLoading(false));
  }, [category]);

  const calcTotal = useMemo(() =>
    items.reduce((s, i) => s + (Number(i.rate) * Number(i.quantity)), 0),
    [items]
  );

  useEffect(() => { setChargedAmt(calcTotal); }, [calcTotal]);

  // Mobile blur → prefill from donation records
  const handleMobileBlur = async () => {
    if (!customer.mobile || customer.mobile.length < 5) return;
    setSearching(true);
    try {
      const res = await searchDonorByMobile(customer.mobile);
      if (res?.length > 0) {
        const r = res[0];
        setCustomer(p => ({ ...p, customerName: r.donorName || p.customerName, address: r.address || p.address }));
        setAutoFilled(true);
      }
    } catch { /* silent */ }
    finally { setSearching(false); }
  };

  const updateItem = (idx, field, val) => {
    const upd = [...items];
    upd[idx] = { ...upd[idx], [field]: val };
    if (field === "inventoryItemId") {
      const inv = inventory.find(i => i.id === Number(val));
      upd[idx].rate = inv?.rate || 0;
    }
    setItems(upd);
  };

  const removeItem = (idx) => { if (items.length > 1) setItems(items.filter((_, i) => i !== idx)); };

  const handleSaveClick = () => {
    setFormError("");
    if (items.length === 0) { setFormError(t.errMinItem); return; }
    const hasEmpty = items.some(i => !i.inventoryItemId);
    if (hasEmpty) { setFormError(t.errSelectItem); return; }
    setShowConfirm(true);
  };

  const doSave = async () => {
    setSaving(true);
    setShowConfirm(false);
    try {
      const blob = await createRentalAndPrint({
        ...customer, category,
        items: items.map(i => ({ inventoryItemId: i.inventoryItemId, quantity: i.quantity })),
        calculatedTotalAmount: calcTotal,
        chargedAmount: chargedAmt || calcTotal,
        depositAmount: depositAmt || 0,
      }, auth.username);
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      window.open(url);
      showToast(t.success);
      reset();
    } catch (e) {
      // API uses responseType:"blob" — on error, response.data is a Blob, not JSON
      // Must read the blob as text first, then parse JSON to get the message
      let msg = "";
      try {
        const errData = e.response?.data;
        if (errData instanceof Blob) {
          const text = await errData.text();
          const parsed = JSON.parse(text);
          msg = parsed.message || parsed.error || text;
        } else {
          msg = errData?.message || errData?.error || "";
        }
      } catch {
        msg = e.message || "";
      }

      if (msg.toLowerCase().includes("out of stock")) {
        const itemName = msg.split(":").slice(1).join(":").trim();
        showToast(t.errOutOfStock(itemName), "error");
      } else if (msg.toLowerCase().includes("category mismatch")) {
        showToast(t.errCategoryMismatch, "error");
      } else {
        showToast(msg || t.error, "error");
      }
    } finally { setSaving(false); }
  };

  const hasValidItem = items.some(i => i.inventoryItemId);
  const fmt = (v) => Number(v || 0).toLocaleString("en-IN");

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "1.2rem 1.5rem", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: "1.2rem", right: "1.2rem", zIndex: 999, background: toast.type === "error" ? C.red : C.green, color: "#fff", padding: "0.85rem 1.2rem", borderRadius: 12, fontSize: "0.84rem", fontWeight: 600, boxShadow: "0 4px 24px rgba(0,0,0,0.2)", maxWidth: toast.type === "error" ? 480 : 360, lineHeight: 1.5 }}>
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div style={{ marginBottom: "1.2rem" }}>
        <p style={{ margin: 0, fontSize: "0.62rem", fontWeight: 700, color: C.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          {language === "hi" ? "किराया" : "Rental"}
        </p>
        <h1 style={{ margin: "0.1rem 0 0", fontSize: "1.3rem", fontWeight: 800, color: C.text, lineHeight: 1 }}>
          {catIcon} {category === "BARTAN" ? t.titleBartan : t.titleBichayat}
        </h1>
      </div>

      {/* ── Section 1: Customer ── */}
      <div style={{ background: C.card, borderRadius: "14px", border: `1px solid ${C.border}`, boxShadow: "0 2px 10px rgba(139,100,60,0.07)", marginBottom: "1rem", overflow: "hidden" }}>
        <div style={{ padding: "0.7rem 1.2rem", borderBottom: `1px solid ${C.border}`, background: "#fdf9f4", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: 3, height: 16, background: C.blue, borderRadius: 2 }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C.text }}>👤 {t.customerSec}</span>
        </div>
        <div style={{ padding: "1rem 1.2rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.9rem" }}>
            <Field label={t.mobile}>
              <div style={{ position: "relative" }}>
                <Inp value={customer.mobile} maxLength={11}
                  onChange={e => { setAutoFilled(false); setCustomer(p => ({ ...p, mobile: e.target.value.replace(/\D/g, "").slice(0, 11) })); }}
                  onBlur={handleMobileBlur} placeholder="10 या 11 अंक" />
                {searching && <span style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.7rem", color: C.muted }}>{t.searching}</span>}
              </div>
            </Field>
            <Field label={t.name} note={autoFilled ? t.autoFilled : ""}>
              <Inp value={customer.customerName} maxLength={60}
                onChange={e => setCustomer(p => ({ ...p, customerName: e.target.value }))} placeholder={t.name} />
            </Field>
            <Field label={t.address}>
              <Inp value={customer.address} maxLength={120}
                onChange={e => setCustomer(p => ({ ...p, address: e.target.value }))} placeholder={t.address} />
            </Field>
          </div>
        </div>
      </div>

      {/* ── Section 2: Items ── */}
      <div style={{ background: C.card, borderRadius: "14px", border: `1px solid ${C.border}`, boxShadow: "0 2px 10px rgba(139,100,60,0.07)", marginBottom: "1rem", overflow: "hidden" }}>
        <div style={{ padding: "0.7rem 1.2rem", borderBottom: `1px solid ${C.border}`, background: "#fdf9f4", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 3, height: 16, background: C.accent, borderRadius: 2 }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C.text }}>{catIcon} {t.itemsSec}</span>
          </div>
          <button onClick={() => setItems([...items, emptyItem()])} style={{
            padding: "0.38rem 0.9rem", background: C.greenBg, border: `1.5px solid ${C.green}40`,
            borderRadius: 8, fontSize: "0.75rem", fontWeight: 700, color: C.green,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = C.green; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.greenBg; e.currentTarget.style.color = C.green; }}
          >{t.addItem}</button>
        </div>

        <div style={{ padding: "0.8rem 1.2rem" }}>
          {invLoading ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: C.muted, fontSize: "0.82rem" }}>{t.loading}</div>
          ) : (
            <>
              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 36px", gap: "0.5rem", padding: "0 0 0.4rem", borderBottom: `1px solid ${C.border}`, marginBottom: "0.5rem" }}>
                {[t.colItem, t.colQty, t.colRate, t.colTotal, ""].map((h, i) => (
                  <div key={i} style={{ fontSize: "0.65rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: i >= 2 ? "right" : "left" }}>{h}</div>
                ))}
              </div>

              {/* Rows */}
              {items.map((row, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 36px", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                  {/* Item select */}
                  <select value={row.inventoryItemId}
                    onChange={e => updateItem(idx, "inventoryItemId", e.target.value)}
                    style={{ ...inp(), cursor: "pointer" }}
                    onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}18`; e.target.style.background = "#fff"; }}
                    onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; e.target.style.background = "#fdf9f4"; }}
                  >
                    <option value="">{t.selectItem}</option>
                    {inventory.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.materialNameHi} ({t.available}: {inv.totalStock})
                      </option>
                    ))}
                  </select>

                  {/* Qty */}
                  <input type="number" min={1} max={9999} value={row.quantity}
                    onChange={e => { const v = Math.max(1, Math.min(9999, Number(e.target.value))); updateItem(idx, "quantity", v); }}
                    style={{ ...inp({ textAlign: "right" }) }}
                    onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.background = "#fff"; }}
                    onBlur={e => { e.target.style.borderColor = C.border; e.target.style.background = "#fdf9f4"; }}
                  />

                  {/* Rate */}
                  <div style={{ ...inp({ display: "flex", alignItems: "center", justifyContent: "flex-end", fontWeight: 600, color: C.muted, background: "#f5f0ea", cursor: "default" }) }}>
                    ₹{row.rate}
                  </div>

                  {/* Row total */}
                  <div style={{ ...inp({ display: "flex", alignItems: "center", justifyContent: "flex-end", fontWeight: 700, color: C.text, background: `${C.accent}0f`, cursor: "default" }) }}>
                    ₹{fmt(row.rate * row.quantity)}
                  </div>

                  {/* Delete */}
                  <button onClick={() => removeItem(idx)} disabled={items.length === 1}
                    style={{ width: 32, height: 32, borderRadius: 7, border: `1px solid ${C.red}30`, background: C.redBg, color: C.red, fontSize: "0.85rem", cursor: items.length === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: items.length === 1 ? 0.35 : 1, transition: "all 0.15s" }}
                    onMouseEnter={e => { if (items.length > 1) e.currentTarget.style.background = C.red; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = C.redBg; e.currentTarget.style.color = C.red; }}
                  >✕</button>
                </div>
              ))}

              {/* Running total row */}
              <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 36px", gap: "0.5rem", marginTop: "0.6rem", paddingTop: "0.6rem", borderTop: `2px solid ${C.border}` }}>
                <div style={{ gridColumn: "1/4" }} />
                <div style={{ textAlign: "right", fontSize: "0.95rem", fontWeight: 900, color: C.accent }}>₹{fmt(calcTotal)}</div>
                <div />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Section 3: Amounts ── */}
      <div style={{ background: C.card, borderRadius: "14px", border: `1px solid ${C.border}`, boxShadow: "0 2px 10px rgba(139,100,60,0.07)", marginBottom: "1rem", overflow: "hidden" }}>
        <div style={{ padding: "0.7rem 1.2rem", borderBottom: `1px solid ${C.border}`, background: "#fdf9f4", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: 3, height: 16, background: C.green, borderRadius: 2 }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C.text }}>💰 {t.amountSec}</span>
        </div>
        <div style={{ padding: "1rem 1.2rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.9rem" }}>
            <Field label={t.calcTotal}>
              <Inp value={`₹${fmt(calcTotal)}`} disabled />
            </Field>
            <Field label={t.charged}>
              <Inp type="number" value={chargedAmt} min={0} max={9999999}
                onChange={e => { const v = e.target.value; if (v === "" || Number(v) >= 0) setChargedAmt(v); }}
                placeholder="0" suffix="₹" />
            </Field>
            <Field label={t.deposit}>
              <Inp type="number" value={depositAmt} min={0} max={9999999}
                onChange={e => { const v = e.target.value; if (v === "" || Number(v) >= 0) setDepositAmt(v); }}
                placeholder="0" suffix="₹" />
            </Field>
          </div>
        </div>
      </div>

      {/* Error */}
      {formError && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", background: C.redBg, border: `1.5px solid ${C.red}`, borderRadius: 10, padding: "0.65rem 1rem", marginBottom: "0.9rem" }}>
          <span>🚨</span>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: C.red }}>{formError}</span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.7rem" }}>
        <button onClick={handleSaveClick} disabled={!hasValidItem || saving} style={{
          padding: "0.75rem 2rem", border: "none", borderRadius: 10,
          background: (!hasValidItem || saving) ? "#e8e0d8" : `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`,
          color: (!hasValidItem || saving) ? "#b0a090" : "#fff",
          fontSize: "0.9rem", fontWeight: 700,
          cursor: (!hasValidItem || saving) ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          boxShadow: (!hasValidItem || saving) ? "none" : `0 4px 14px ${C.accent}40`,
          transition: "all 0.2s",
        }}>
          {saving ? "⏳ ..." : `🖨️ ${t.saveBtn}`}
        </button>
        <button onClick={reset} style={{
          padding: "0.75rem 1.4rem", background: "transparent",
          border: `1.5px solid ${C.border}`, borderRadius: 10,
          color: C.muted, fontSize: "0.88rem", fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
        >{t.resetBtn}</button>
      </div>

      {/* ── Confirm Modal ── */}
      {showConfirm && (
        <>
          <div onClick={() => setShowConfirm(false)} style={{ position: "fixed", inset: 0, background: "rgba(45,31,15,0.45)", zIndex: 200, backdropFilter: "blur(3px)" }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 201, width: "min(440px, 92vw)",
            background: "#fff", borderRadius: "20px",
            boxShadow: "0 20px 60px rgba(45,31,15,0.25)",
            overflow: "hidden",
            animation: "fadeUp 0.2s ease-out",
          }}>
            <style>{`@keyframes fadeUp { from { opacity:0; transform:translate(-50%,-45%); } to { opacity:1; transform:translate(-50%,-50%); } }`}</style>

            {/* Modal header */}
            <div style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`, padding: "1.2rem 1.5rem" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "0.3rem" }}>🖨️</div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#fff" }}>{t.confirmTitle}</h3>
              <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "#fff9" }}>{t.confirmSub}</p>
            </div>

            {/* Summary */}
            <div style={{ padding: "1.2rem 1.5rem" }}>
              {/* Customer row */}
              {customer.customerName && (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.8rem", padding: "0.6rem 0.8rem", background: C.blueBg, borderRadius: 10 }}>
                  <span>👤</span>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: C.text }}>{customer.customerName}</p>
                    {customer.mobile && <p style={{ margin: 0, fontSize: "0.72rem", color: C.muted }}>{customer.mobile}{customer.address ? " • " + customer.address : ""}</p>}
                  </div>
                </div>
              )}

              {/* Items summary */}
              <div style={{ marginBottom: "0.8rem" }}>
                {items.filter(i => i.inventoryItemId).map((item, idx) => {
                  const inv = inventory.find(i => i.id === Number(item.inventoryItemId));
                  return (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: `1px solid ${C.border}`, fontSize: "0.82rem" }}>
                      <span style={{ color: C.text, fontWeight: 600 }}>{inv?.materialNameHi || "?"} × {item.quantity}</span>
                      <span style={{ fontWeight: 700, color: C.text }}>₹{fmt(item.rate * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div style={{ background: "#fdf6ee", borderRadius: 10, padding: "0.8rem 1rem" }}>
                {[
                  { label: t.totalLabel, value: `₹${fmt(chargedAmt || calcTotal)}`, bold: false },
                  { label: t.depositLabel, value: `₹${fmt(depositAmt || 0)}`, bold: false },
                  { label: language === "hi" ? "देय कुल" : "Grand Total", value: `₹${fmt((Number(chargedAmt || calcTotal)) + (Number(depositAmt || 0)))}`, bold: true },
                ].map(({ label, value, bold }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0" }}>
                    <span style={{ fontSize: "0.8rem", color: C.muted, fontWeight: bold ? 700 : 500 }}>{label}</span>
                    <span style={{ fontSize: bold ? "1rem" : "0.85rem", fontWeight: bold ? 900 : 700, color: bold ? C.accent : C.text }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "0.9rem 1.5rem", borderTop: `1px solid ${C.border}`, display: "flex", gap: "0.6rem", justifyContent: "flex-end", background: "#fdf9f4" }}>
              <button onClick={() => setShowConfirm(false)} style={{
                padding: "0.6rem 1.2rem", background: "transparent",
                border: `1.5px solid ${C.border}`, borderRadius: 9,
                color: C.muted, fontSize: "0.82rem", fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.muted}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >← {t.confirmCancel}</button>
              <button onClick={doSave} style={{
                padding: "0.6rem 1.5rem",
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`,
                color: "#fff", border: "none", borderRadius: 9,
                fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", boxShadow: `0 3px 10px ${C.accent}40`,
              }}>🖨️ {t.confirmSave}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
