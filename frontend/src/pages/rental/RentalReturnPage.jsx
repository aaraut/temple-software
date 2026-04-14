import { useState, useEffect, useRef } from "react";
import { getRentalByReceipt, returnRental, searchRentalsByMobile, searchRentalsByName, reprintRentalReceipt } from "../../api/rentalApi";
import { useAuth } from "../../context/AuthContext";

const C = {
  bg: "#fdf9f4", card: "#ffffff",
  accent: "#c8894a", accentDk: "#9a6030",
  border: "#e8ddd0", text: "#2d1f0f", muted: "#8a7560",
  green: "#2d7a2d", greenBg: "#e8f5e8",
  red: "#b03030", redBg: "#fdf0f0",
  blue: "#1a4a8a", blueBg: "#e8f0fc",
  yellow: "#b07800", yellowBg: "#fffbe6",
};

const inpBase = { boxSizing: "border-box", width: "100%", padding: "0.62rem 0.85rem", border: `1.5px solid #e8ddd0`, borderRadius: "9px", fontSize: "0.88rem", background: "#fdf9f4", color: "#2d1f0f", fontFamily: "inherit", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s" };

function Inp({ value, onChange, onKeyDown, placeholder, type = "text", maxLength, disabled }) {
  const [f, setF] = useState(false);
  return (
    <input type={type} value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder} maxLength={maxLength} disabled={disabled}
      style={{ ...inpBase, ...(f && !disabled ? { borderColor: "#c8894a", boxShadow: "0 0 0 3px #c8894a18", background: "#fff" } : {}), ...(disabled ? { background: "#f5f0ea", color: "#8a7560", cursor: "not-allowed" } : {}) }}
      onFocus={() => setF(true)} onBlur={() => setF(false)} />
  );
}

function NumInp({ value, onChange, max, disabled }) {
  const [f, setF] = useState(false);
  return (
    <input type="number" min={0} max={max} value={value} disabled={disabled}
      onChange={e => onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0)))}
      style={{ ...inpBase, textAlign: "center", width: 70, padding: "0.55rem 0.3rem", ...(f && !disabled ? { borderColor: "#c8894a", background: "#fff" } : {}), ...(disabled ? { background: "#f5f0ea", color: "#8a7560", cursor: "not-allowed" } : {}) }}
      onFocus={() => setF(true)} onBlur={() => setF(false)} />
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.28rem" }}>
      <label style={{ fontSize: "0.68rem", fontWeight: 700, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>
      {children}
    </div>
  );
}

const L = {
  hi: {
    title: "किराया वापसी", sub: "किराया",
    tabReceipt: "रसीद नंबर", tabMobile: "मोबाइल", tabName: "नाम",
    receiptPh: "रसीद नंबर दर्ज करें", mobilePh: "मोबाइल नंबर", namePh: "नाम के अक्षर टाइप करें...",
    searchBtn: "खोजें", searching: "खोज रहे हैं...",
    fine: "जुर्माना / नुकसान (₹)", remarks: "टिप्पणी",
    submit: "वापसी दर्ज करें", back: "← वापस",
    notFound: "रसीद नहीं मिली", noResults: "कोई रिकॉर्ड नहीं मिला",
    success: "वापसी सफलतापूर्वक दर्ज हुई", errorReturn: "वापसी में त्रुटि",
    selectRecord: "रिकॉर्ड चुनें", useThis: "अपडेट", printReceipt: "प्रिंट",
    colReceipt: "रसीद", colName: "नाम", colMobile: "मोबाइल", colCat: "श्रेणी",
    colStatus: "स्थिति", colDate: "दिनांक", colAction: "कार्य",
    colItem: "सामान", colIssued: "जारी", colRemaining: "बाकी",
    colReturn: "वापस", colDamaged: "टूटा", colMissing: "गायब",
    bartan: "🍳 बर्तन", bichayat: "🛋️ बिछायत",
    customerInfo: "ग्राहक विवरण", itemsTitle: "सामान वापसी", amountTitle: "राशि विवरण",
    name: "नाम", mobile: "मोबाइल", address: "पता", category: "श्रेणी",
    charged: "देय राशि", deposit: "जमानत", existingFine: "पूर्व जुर्माना",
    statusLabel: { ACTIVE: "सक्रिय", CLOSED: "बंद", PARTIAL: "आंशिक" },
    errorMsgs: { "Rental already closed": "किराया पहले से बंद हो चुका है", "Rental already returned": "किराया पहले से वापस हो चुका है", "Receipt not found": "रसीद नहीं मिली", "Rental not found": "किराया नहीं मिला", "Invalid receipt number": "अमान्य रसीद नंबर", "Invalid receipt": "अमान्य रसीद" },
  },
  en: {
    title: "Rental Return", sub: "Rental",
    tabReceipt: "Receipt No.", tabMobile: "Mobile", tabName: "Name",
    receiptPh: "Enter receipt number", mobilePh: "Mobile number", namePh: "Type customer name...",
    searchBtn: "Search", searching: "Searching...",
    fine: "Fine / Damage (₹)", remarks: "Remarks",
    submit: "Submit Return", back: "← Back",
    notFound: "Receipt not found", noResults: "No records found",
    success: "Return submitted successfully", errorReturn: "Error in return submission",
    selectRecord: "Select Record", useThis: "Update", printReceipt: "Print",
    colReceipt: "Receipt", colName: "Name", colMobile: "Mobile", colCat: "Category",
    colStatus: "Status", colDate: "Date", colAction: "Action",
    colItem: "Item", colIssued: "Issued", colRemaining: "Remaining",
    colReturn: "Return", colDamaged: "Damaged", colMissing: "Missing",
    bartan: "🍳 Bartan", bichayat: "🛋️ Bichayat",
    customerInfo: "Customer Info", itemsTitle: "Return Items", amountTitle: "Amount Details",
    name: "Name", mobile: "Mobile", address: "Address", category: "Category",
    charged: "Charged", deposit: "Deposit", existingFine: "Existing Fine",
    statusLabel: { ACTIVE: "Active", CLOSED: "Closed", PARTIAL: "Partial" },
    errorMsgs: {},
  },
};

const statusStyle = {
  ACTIVE:  { bg: "#e8f5e8", color: "#2d7a2d", border: "#2d7a2d30" },
  CLOSED:  { bg: "#f0f0f0", color: "#666",    border: "#66666630" },
  PARTIAL: { bg: "#fffbe6", color: "#b07800", border: "#b0780030" },
};

const fmt     = (v) => Number(v || 0).toLocaleString("en-IN");
const fmtDate = (d) => { if (!d) return "-"; const dt = new Date(d); return dt.toLocaleDateString("en-IN") + " " + dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }); };


function SectionHeader({ color, title }) {
  return (
    <div style={{ padding: "0.7rem 1.2rem", borderBottom: `1px solid ${C.border}`, background: "#fdf9f4", display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ width: 3, height: 16, background: color, borderRadius: 2 }} />
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C.text }}>{title}</span>
    </div>
  );
}

function Card({ children, extra = {} }) {
  return (
    <div style={{ background: C.card, borderRadius: "14px", border: `1px solid ${C.border}`, boxShadow: "0 2px 10px rgba(139,100,60,0.07)", marginBottom: "1rem", overflow: "hidden", ...extra }}>{children}</div>
  );
}

export default function RentalReturnPage() {
  const { auth, language } = useAuth();
  const t = L[language] ?? L.hi;

  const [tab,            setTab]            = useState(0);
  const [receiptNum,     setReceiptNum]     = useState("");
  const [mobile,         setMobile]         = useState("");
  const [nameQuery,      setNameQuery]      = useState("");
  const [suggestions,    setSuggestions]    = useState([]);
  const [suggSearching,  setSuggSearching]  = useState(false);
  const [results,        setResults]        = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [rental,         setRental]         = useState(null);
  const [returnItems,    setReturnItems]    = useState({});
  const [fineAmt,        setFineAmt]        = useState("");
  const [remarks,        setRemarks]        = useState("");
  const [toast,          setToast]          = useState(null);
  const [searchErr,      setSearchErr]      = useState("");

  const nameDebounce   = useRef(null);
  const mobileDebounce = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), type === "error" ? 7000 : 5000);
  };

  const clearSearch = () => { setResults([]); setSearchErr(""); setSuggestions([]); };

  const handleUnifiedSearch = async () => {
    clearSearch();
    setResultsLoading(true);
    try {
      if (receiptNum.trim()) {
        const resp = await getRentalByReceipt(receiptNum.trim());
        setRental(resp); setReturnItems({});
        setResultsLoading(false); return;
      }
      let res = [];
      if (mobile.trim()) res = await searchRentalsByMobile(mobile.trim());
      else if (nameQuery.trim()) res = await searchRentalsByName(nameQuery.trim());
      setResults(res || []);
      if (!res?.length) setSearchErr(t.noResults);
    } catch (e) {
      const msg = e?.response?.data?.message || "";
      setSearchErr(t.errorMsgs[msg] || msg || t.notFound);
    } finally { setResultsLoading(false); }
  };

  useEffect(() => {
    if (mobile.length < 4) { clearSearch(); return; }
    if (mobileDebounce.current) clearTimeout(mobileDebounce.current);
    mobileDebounce.current = setTimeout(async () => {
      setResultsLoading(true);
      try { const res = await searchRentalsByMobile(mobile.trim()); setResults(res || []); if (!res?.length) setSearchErr(t.noResults); else setSearchErr(""); }
      catch { setSearchErr(t.noResults); }
      finally { setResultsLoading(false); }
    }, 350);
  }, [mobile]);

  useEffect(() => {
    if (nameQuery.length < 2) { setSuggestions([]); return; }
    if (nameDebounce.current) clearTimeout(nameDebounce.current);
    nameDebounce.current = setTimeout(async () => {
      setSuggSearching(true);
      try { const res = await searchRentalsByName(nameQuery); const u = [...new Map((res||[]).map(r=>[r.customerName,r])).values()]; setSuggestions(u.slice(0,8)); }
      catch { setSuggestions([]); }
      finally { setSuggSearching(false); }
    }, 300);
  }, [nameQuery]);

  const searchByReceipt = async () => {
    setSearchErr(""); setRental(null);
    try { const resp = await getRentalByReceipt(receiptNum.trim()); setRental(resp); setReturnItems({}); }
    catch { setSearchErr(t.notFound); }
  };

  const searchByName = async (name) => {
    setNameQuery(name); setSuggestions([]); clearSearch(); setResultsLoading(true);
    try { const res = await searchRentalsByName(name); setResults(res||[]); if (!res?.length) setSearchErr(t.noResults); }
    catch { setSearchErr(t.noResults); }
    finally { setResultsLoading(false); }
  };

  const selectRecord = async (receipt) => {
    setSearchErr("");
    try { const resp = await getRentalByReceipt(receipt); setRental(resp); setReturnItems({}); setResults([]); }
    catch (e) { const msg = e.response?.data?.message||""; setSearchErr(t.errorMsgs[msg]||msg||t.notFound); }
  };

  const updateItem = (item, field, value) => {
    setReturnItems(prev => ({ ...prev, [item.rentalItemId]: { rentalItemId: item.rentalItemId, returnedQty: field==="returnedQty"?value:(prev[item.rentalItemId]?.returnedQty??0), damagedQty: field==="damagedQty"?value:(prev[item.rentalItemId]?.damagedQty??0), missingQty: field==="missingQty"?value:(prev[item.rentalItemId]?.missingQty??0) } }));
  };

  const handleSubmit = async () => {
    try {
      await returnRental({ receiptNumber: rental.receiptNumber, fineAmount: fineAmt||0, remarks, handledBy: auth.username, items: Object.values(returnItems) });
      showToast(t.success);
      setRental(null); setReceiptNum(""); setMobile(""); setNameQuery(""); setResults([]); setFineAmt(""); setRemarks("");
    } catch (e) {
      const msg = e.response?.data?.message||"";
      showToast(t.errorMsgs[msg]||msg||t.errorReturn, "error");
    }
  };

  const handleReprint = async (receiptNumber) => {
    try {
      const blob = await reprintRentalReceipt(receiptNumber);
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      window.open(url);
    } catch (e) {
      const msg = e.response?.data?.message || "";
      showToast(msg || (language === "hi" ? "प्रिंट में त्रुटि" : "Print failed"), "error");
    }
  };

  const catLabel = (c) => c==="BARTAN" ? t.bartan : t.bichayat;


  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "1.2rem 1.5rem", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {toast && (
        <div style={{ position: "fixed", top: "1.2rem", right: "1.2rem", zIndex: 999, background: toast.type==="error"?C.red:C.green, color: "#fff", padding: "0.8rem 1.2rem", borderRadius: 12, fontSize: "0.84rem", fontWeight: 600, boxShadow: "0 4px 24px rgba(0,0,0,0.2)", maxWidth: 420, lineHeight: 1.5 }}>
          {toast.type==="error" ? "⚠️ " : "✓ "}{toast.msg}
        </div>
      )}

      <div style={{ marginBottom: "1.2rem" }}>
        <p style={{ margin: 0, fontSize: "0.62rem", fontWeight: 700, color: C.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>{t.sub}</p>
        <h1 style={{ margin: "0.1rem 0 0", fontSize: "1.3rem", fontWeight: 800, color: C.text, lineHeight: 1 }}>↩️ {t.title}</h1>
      </div>

      {rental ? (
        <>
          <button onClick={() => { setRental(null); setReturnItems({}); setFineAmt(""); setRemarks(""); }} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 1rem", background: "transparent", border: `1.5px solid ${C.border}`, borderRadius: 9, color: C.muted, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: "1rem" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.color=C.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.muted; }}
          >{t.back}</button>

          <Card>
            <SectionHeader color={C.blue} title={`👤 ${t.customerInfo}`} />
            <div style={{ padding: "0.9rem 1.2rem", display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.72rem", fontFamily: "monospace", fontWeight: 800, color: C.accent, background: `${C.accent}15`, border: `1px solid ${C.accent}30`, borderRadius: 6, padding: "0.2rem 0.6rem", alignSelf: "center" }}>{rental.receiptNumber}</span>
              {[[t.name, rental.customerName],[t.mobile, rental.mobile],[t.address, rental.address],[t.category, catLabel(rental.category)],[t.charged, `₹${fmt(rental.chargedAmount)}`],[t.deposit, `₹${fmt(rental.depositAmount)}`],[t.existingFine, `₹${fmt(rental.totalFineAmount)}`]].map(([label, value]) => (
                <div key={label}>
                  <p style={{ margin: 0, fontSize: "0.62rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
                  <p style={{ margin: "0.1rem 0 0", fontSize: "0.88rem", fontWeight: 600, color: C.text }}>{value||"—"}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader color={C.accent} title={`📦 ${t.itemsTitle}`} />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fdf6ee" }}>
                    {[[t.colItem,"left","auto"],[t.colIssued,"center",80],[t.colRemaining,"center",90],[t.colReturn,"center",90],[t.colDamaged,"center",90],[t.colMissing,"center",90]].map(([lbl,align,w]) => (
                      <th key={lbl} style={{ padding: "0.55rem 0.9rem", textAlign: align, fontSize: "0.65rem", fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `2px solid ${C.border}`, width: w!=="auto"?w:undefined }}>{lbl}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rental.items.map((item, i) => (
                    <tr key={item.rentalItemId} style={{ borderBottom: `1px solid ${C.border}`, background: i%2?"#fdf9f4":"transparent" }}>
                      <td style={{ padding: "0.6rem 0.9rem", fontSize: "0.85rem", fontWeight: 600, color: C.text }}>{item.itemName}</td>
                      <td style={{ padding: "0.6rem 0.9rem", textAlign: "center", fontSize: "0.85rem", fontWeight: 700, color: C.text }}>{item.issuedQty}</td>
                      <td style={{ padding: "0.6rem 0.9rem", textAlign: "center" }}>
                        <span style={{ display: "inline-block", padding: "0.15rem 0.5rem", borderRadius: 6, fontSize: "0.82rem", fontWeight: 700, background: item.remainingQty>0?C.yellowBg:C.greenBg, color: item.remainingQty>0?C.yellow:C.green }}>{item.remainingQty}</span>
                      </td>
                      {["returnedQty","damagedQty","missingQty"].map(field => (
                        <td key={field} style={{ padding: "0.5rem 0.6rem", textAlign: "center" }}>
                          <NumInp value={returnItems[item.rentalItemId]?.[field]??0} max={item.remainingQty} disabled={item.remainingQty===0} onChange={v => updateItem(item, field, v)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <SectionHeader color={C.green} title={`💰 ${t.amountTitle}`} />
            <div style={{ padding: "1rem 1.2rem", display: "flex", gap: "0.9rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <Field label={t.fine}>
                <div style={{ width: 180 }}>
                  <Inp type="number" value={fineAmt} onChange={e => { const v=e.target.value; if(v===""||Number(v)>=0) setFineAmt(v); }} placeholder="0" />
                </div>
              </Field>
              <Field label={t.remarks}>
                <div style={{ minWidth: 260, flex: 1 }}>
                  <Inp value={remarks} onChange={e => setRemarks(e.target.value)} maxLength={200} placeholder={language==="hi"?"वैकल्पिक टिप्पणी":"Optional remarks"} />
                </div>
              </Field>
              <button onClick={handleSubmit} style={{ padding: "0.65rem 2rem", border: "none", borderRadius: 9, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`, color: "#fff", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 3px 12px ${C.accent}40`, transition: "all 0.15s", whiteSpace: "nowrap" }}
                onMouseEnter={e => e.currentTarget.style.transform="translateY(-1px)"}
                onMouseLeave={e => e.currentTarget.style.transform="none"}
              >↩️ {t.submit}</button>
            </div>
          </Card>
        </>
      ) : (
        <>
          <Card extra={{ overflow: "visible" }}>
            <div style={{ padding: "1rem 1.2rem", display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>

              {/* Receipt */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.28rem", flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: "0.68rem", fontWeight: 700, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase" }}>{t.tabReceipt}</label>
                <Inp value={receiptNum} onChange={e => { setReceiptNum(e.target.value); setMobile(""); setNameQuery(""); setSuggestions([]); setResults([]); setSearchErr(""); }}
                  onKeyDown={e => e.key==="Enter" && handleUnifiedSearch()}
                  placeholder={t.receiptPh} maxLength={30} />
              </div>

              {/* Mobile */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.28rem", flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: "0.68rem", fontWeight: 700, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase" }}>{t.tabMobile}</label>
                <Inp value={mobile} maxLength={11}
                  onChange={e => { setReceiptNum(""); setNameQuery(""); setSuggestions([]); setResults([]); setSearchErr(""); setMobile(e.target.value.replace(/\D/g, "").slice(0, 11)); }}
                  onKeyDown={e => e.key==="Enter" && handleUnifiedSearch()}
                  placeholder={t.mobilePh} />
              </div>

              {/* Name with autocomplete */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.28rem", flex: 2, minWidth: 200, position: "relative" }}>
                <label style={{ fontSize: "0.68rem", fontWeight: 700, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase" }}>{t.tabName}</label>
                <div style={{ position: "relative" }}>
                  <Inp value={nameQuery}
                    onChange={e => { setReceiptNum(""); setMobile(""); setResults([]); setSearchErr(""); setNameQuery(e.target.value); }}
                    onKeyDown={e => e.key==="Enter" && handleUnifiedSearch()}
                    placeholder={t.namePh} maxLength={60} />
                  {suggSearching && <span style={{ position: "absolute", right: "0.8rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.7rem", color: C.muted, pointerEvents: "none" }}>{t.searching}</span>}
                </div>
                {suggestions.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 10, zIndex: 50, maxHeight: 220, overflowY: "auto", boxShadow: "0 8px 24px rgba(45,31,15,0.12)" }}>
                    {suggestions.map(s => (
                      <div key={s.receiptNumber} onClick={() => { setNameQuery(s.customerName); setSuggestions([]); }}
                        style={{ padding: "0.6rem 1rem", display: "flex", justifyContent: "space-between", cursor: "pointer", borderBottom: `1px solid ${C.border}`, fontSize: "0.85rem", transition: "background 0.1s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#fdf9f4"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <span style={{ fontWeight: 600, color: C.text }}>{s.customerName}</span>
                        <span style={{ fontSize: "0.72rem", color: C.muted }}>{s.mobile}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Search button */}
              <button onClick={handleUnifiedSearch} disabled={resultsLoading} style={{
                padding: "0.62rem 1.4rem", background: resultsLoading ? "#e8e0d8" : `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`,
                border: "none", borderRadius: 9, color: resultsLoading ? "#b0a090" : "#fff",
                fontSize: "0.82rem", fontWeight: 700, cursor: resultsLoading ? "not-allowed" : "pointer",
                fontFamily: "inherit", whiteSpace: "nowrap", alignSelf: "flex-end",
              }}>
                {resultsLoading ? t.searching : `🔍 ${t.searchBtn}`}
              </button>
            </div>
          </Card>

          {searchErr && (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", background: C.redBg, border: `1.5px solid ${C.red}`, borderRadius: 10, padding: "0.65rem 1rem", marginBottom: "1rem" }}>
              <span>⚠️</span><span style={{ fontSize: "0.8rem", fontWeight: 600, color: C.red }}>{searchErr}</span>
            </div>
          )}

          {results.length>0 && (
            <Card>
              <div style={{ padding: "0.7rem 1.2rem", borderBottom: `1px solid ${C.border}`, background: "#fdf9f4", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: 3, height: 16, background: C.accent, borderRadius: 2 }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C.text }}>{t.selectRecord}</span>
                <span style={{ background: `${C.accent}20`, border: `1px solid ${C.accent}40`, borderRadius: 20, padding: "0.1rem 0.55rem", fontSize: "0.65rem", fontWeight: 800, color: C.accent }}>{results.length}</span>
              </div>
              <div style={{ overflowY: "auto", maxHeight: "55vh" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                    <tr style={{ background: "#fdf6ee" }}>
                      {[t.colReceipt,t.colName,t.colMobile,t.colCat,t.colStatus,t.colDate,t.colAction].map(h => (
                        <th key={h} style={{ padding: "0.55rem 0.9rem", textAlign: "left", fontSize: "0.65rem", fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `2px solid ${C.border}`, background: "#fdf6ee" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r,i) => {
                      const ss = statusStyle[r.status]||statusStyle.CLOSED;
                      const sl = (t.statusLabel||{})[r.status]||r.status;
                      return (
                        <tr key={r.receiptNumber} style={{ borderBottom: `1px solid ${C.border}`, background: i%2?"#fdf9f4":"transparent", transition: "background 0.1s" }}
                          onMouseEnter={e => e.currentTarget.style.background=`${C.accent}08`}
                          onMouseLeave={e => e.currentTarget.style.background=i%2?"#fdf9f4":"transparent"}
                        >
                          <td style={{ padding: "0.55rem 0.9rem", fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 700, color: C.accentDk }}>{r.receiptNumber}</td>
                          <td style={{ padding: "0.55rem 0.9rem", fontSize: "0.83rem", fontWeight: 600, color: C.text }}>{r.customerName}</td>
                          <td style={{ padding: "0.55rem 0.9rem", fontSize: "0.8rem", color: C.muted }}>{r.mobile}</td>
                          <td style={{ padding: "0.55rem 0.9rem", fontSize: "0.8rem" }}>{catLabel(r.category)}</td>
                          <td style={{ padding: "0.55rem 0.9rem" }}><span style={{ display: "inline-block", padding: "0.18rem 0.55rem", borderRadius: 20, fontSize: "0.68rem", fontWeight: 700, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>{sl}</span></td>
                          <td style={{ padding: "0.55rem 0.9rem", fontSize: "0.78rem", color: C.muted }}>{fmtDate(r.createdAt)}</td>
                          <td style={{ padding: "0.55rem 0.9rem" }}>
                            <div style={{ display: "flex", gap: "0.35rem" }}>
                              <button onClick={() => selectRecord(r.receiptNumber)} style={{ padding: "0.32rem 0.8rem", background: C.blueBg, color: C.blue, border: `1.5px solid ${C.blue}30`, borderRadius: 7, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                                onMouseEnter={e => { e.currentTarget.style.background=C.blue; e.currentTarget.style.color="#fff"; }}
                                onMouseLeave={e => { e.currentTarget.style.background=C.blueBg; e.currentTarget.style.color=C.blue; }}
                              >✏️ {t.useThis}</button>
                              <button onClick={() => handleReprint(r.receiptNumber)} style={{ padding: "0.32rem 0.8rem", background: C.greenBg, color: C.green, border: `1.5px solid ${C.green}30`, borderRadius: 7, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                                onMouseEnter={e => { e.currentTarget.style.background=C.green; e.currentTarget.style.color="#fff"; }}
                                onMouseLeave={e => { e.currentTarget.style.background=C.greenBg; e.currentTarget.style.color=C.green; }}
                              >🖨️ {t.printReceipt}</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
