import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { searchDonations, printDonation, changeDonationStatus } from "../../api/donationApi";
import { useNavigate } from "react-router-dom";

const C = {
  bg: "#fdf9f4", card: "#ffffff",
  accent: "#c8894a", accentDk: "#9a6030",
  border: "#e8ddd0", text: "#2d1f0f", muted: "#8a7560",
  green: "#2d7a2d", greenBg: "#e8f5e8",
  red: "#b03030", redBg: "#fdf0f0",
  blue: "#1a4a8a", blueBg: "#e8f0fc",
};

const inpBase = { boxSizing: "border-box", width: "100%", padding: "0.62rem 0.85rem", border: `1.5px solid ${C.border}`, borderRadius: "9px", fontSize: "0.88rem", background: "#fdf9f4", color: C.text, fontFamily: "inherit", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s" };

function Inp({ value, onChange, onKeyDown, placeholder, maxLength }) {
  const [f, setF] = useState(false);
  return (
    <input value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder} maxLength={maxLength}
      style={{ ...inpBase, ...(f ? { borderColor: C.accent, boxShadow: `0 0 0 3px ${C.accent}18`, background: "#fff" } : {}) }}
      onFocus={() => setF(true)} onBlur={() => setF(false)} />
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.28rem", flex: 1, minWidth: 140 }}>
      <label style={{ fontSize: "0.68rem", fontWeight: 700, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>
      {children}
    </div>
  );
}

const L = {
  hi: {
    title: "दान रसीद खोजें", sub: "दान",
    receipt: "रसीद नंबर", mobile: "मोबाइल नंबर", name: "दाता का नाम",
    receiptPh: "जैसे DN-2024-001", mobilePh: "10 या 11 अंक", namePh: "नाम से खोजें",
    searchBtn: "खोजें", searching: "खोज रहे हैं...",
    noResults: "कोई रिकॉर्ड नहीं मिला",
    colReceipt: "रसीद", colName: "दाता", colMobile: "मोबाइल",
    colPurpose: "उद्देश्य", colAmount: "राशि", colDate: "दिनांक", colAction: "कार्य",
    view: "देखें", print: "प्रिंट", update: "अपडेट", disable: "बंद करें",
    results: "परिणाम",
  },
  en: {
    title: "Search Donations", sub: "Donation",
    receipt: "Receipt Number", mobile: "Mobile Number", name: "Donor Name",
    receiptPh: "e.g. DN-2024-001", mobilePh: "10 or 11 digits", namePh: "Search by name",
    searchBtn: "Search", searching: "Searching...",
    noResults: "No records found",
    colReceipt: "Receipt", colName: "Donor", colMobile: "Mobile",
    colPurpose: "Purpose", colAmount: "Amount", colDate: "Date", colAction: "Actions",
    view: "View", print: "Print", update: "Update", disable: "Disable",
    results: "Results",
  },
};

const fmt     = (v) => Number(v || 0).toLocaleString("en-IN");
const fmtDate = (d) => d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export default function DonationSearch() {
  const { auth, language } = useAuth();
  const navigate = useNavigate();
  const t = L[language] ?? L.en;
  const isAdmin = auth?.role === "ADMIN" || auth?.role === "SUPER_ADMIN";

  const [receipt,  setReceipt]  = useState("");
  const [mobile,   setMobile]   = useState("");
  const [name,     setName]     = useState("");
  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const [toast,    setToast]    = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  // Clear other fields when typing in one
  const onReceiptChange = (e) => { setReceipt(e.target.value); setMobile(""); setName(""); setRows([]); setSearched(false); };
  const onMobileChange  = (e) => { setMobile(e.target.value.replace(/\D/g, "").slice(0, 11)); setReceipt(""); setName(""); setRows([]); setSearched(false); };
  const onNameChange    = (e) => { setName(e.target.value); setReceipt(""); setMobile(""); setRows([]); setSearched(false); };

  const handleSearch = async () => {
    if (!receipt.trim() && !mobile.trim() && !name.trim()) return;
    setLoading(true);
    try {
      const res = await searchDonations({
        receiptNumber: receipt.trim() || undefined,
        mobile: mobile.trim() || undefined,
        donorName: name.trim() || undefined,
      });
      setRows(res.data || []);
      setSearched(true);
    } catch (e) {
      showToast(e.response?.data?.message || (language === "hi" ? "खोज में त्रुटि" : "Search failed"), "error");
    } finally { setLoading(false); }
  };

  const handlePrint = async (row) => {
    try {
      const response = await printDonation(row.id);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      window.open(url);
    } catch { showToast(language === "hi" ? "प्रिंट में त्रुटि" : "Print failed", "error"); }
  };

  const handleDisable = async (row) => {
    if (!window.confirm(language === "hi" ? `रसीद ${row.receiptNumber} बंद करें?` : `Disable receipt ${row.receiptNumber}?`)) return;
    try {
      await changeDonationStatus(row.id, false);
      showToast(language === "hi" ? "रसीद बंद कर दी गई" : "Receipt disabled");
      handleSearch();
    } catch { showToast(language === "hi" ? "त्रुटि हुई" : "Failed", "error"); }
  };

  const ready = receipt.trim() || mobile.trim() || name.trim();

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "1.2rem 1.5rem", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {toast && (
        <div style={{ position: "fixed", top: "1.2rem", right: "1.2rem", zIndex: 999, background: toast.type === "error" ? C.red : C.green, color: "#fff", padding: "0.75rem 1.1rem", borderRadius: 10, fontSize: "0.82rem", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", maxWidth: 380 }}>
          {toast.type === "error" ? "⚠️ " : "✓ "}{toast.msg}
        </div>
      )}

      <div style={{ marginBottom: "1.2rem" }}>
        <p style={{ margin: 0, fontSize: "0.62rem", fontWeight: 700, color: C.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>{t.sub}</p>
        <h1 style={{ margin: "0.1rem 0 0", fontSize: "1.3rem", fontWeight: 800, color: C.text, lineHeight: 1 }}>🔍 {t.title}</h1>
      </div>

      {/* Search card */}
      <div style={{ background: C.card, borderRadius: "14px", border: `1px solid ${C.border}`, boxShadow: "0 2px 10px rgba(139,100,60,0.07)", marginBottom: "1rem", overflow: "visible" }}>
        <div style={{ padding: "1rem 1.2rem", display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <Field label={t.receipt}>
            <Inp value={receipt} onChange={onReceiptChange} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder={t.receiptPh} maxLength={30} />
          </Field>
          <Field label={t.mobile}>
            <Inp value={mobile} onChange={onMobileChange} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder={t.mobilePh} maxLength={11} />
          </Field>
          <Field label={t.name}>
            <Inp value={name} onChange={onNameChange} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder={t.namePh} maxLength={60} />
          </Field>
          <button onClick={handleSearch} disabled={!ready || loading} style={{
            padding: "0.62rem 1.5rem", border: "none", borderRadius: 9,
            background: (!ready || loading) ? "#e8e0d8" : `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`,
            color: (!ready || loading) ? "#b0a090" : "#fff",
            fontSize: "0.85rem", fontWeight: 700,
            cursor: (!ready || loading) ? "not-allowed" : "pointer",
            fontFamily: "inherit", whiteSpace: "nowrap", alignSelf: "flex-end",
            boxShadow: (!ready || loading) ? "none" : `0 3px 10px ${C.accent}40`,
          }}>
            {loading ? t.searching : `🔍 ${t.searchBtn}`}
          </button>
        </div>
      </div>

      {/* No results */}
      {searched && rows.length === 0 && (
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: "2.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>🙏</div>
          <p style={{ margin: 0, color: C.muted, fontSize: "0.85rem" }}>{t.noResults}</p>
        </div>
      )}

      {/* Results table */}
      {rows.length > 0 && (
        <div style={{ background: C.card, borderRadius: "14px", border: `1px solid ${C.border}`, boxShadow: "0 2px 10px rgba(139,100,60,0.07)", overflow: "hidden" }}>
          <div style={{ padding: "0.7rem 1.2rem", borderBottom: `1px solid ${C.border}`, background: "#fdf9f4", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 3, height: 16, background: C.accent, borderRadius: 2 }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C.text }}>🙏 {t.results}</span>
            <span style={{ background: `${C.accent}20`, border: `1px solid ${C.accent}40`, borderRadius: 20, padding: "0.1rem 0.55rem", fontSize: "0.65rem", fontWeight: 800, color: C.accent }}>{rows.length}</span>
          </div>
          <div style={{ overflowY: "auto", maxHeight: "65vh" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <tr style={{ background: "#fdf6ee" }}>
                  {[t.colReceipt, t.colName, t.colMobile, t.colPurpose, t.colAmount, t.colDate, t.colAction].map(h => (
                    <th key={h} style={{ padding: "0.55rem 0.9rem", textAlign: "left", fontSize: "0.65rem", fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `2px solid ${C.border}`, background: "#fdf6ee" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id}
                    style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 ? "#fdf9f4" : "transparent", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = `${C.accent}08`}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 ? "#fdf9f4" : "transparent"}
                  >
                    <td style={{ padding: "0.55rem 0.9rem", fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 700, color: C.accentDk }}>{row.receiptNumber}</td>
                    <td style={{ padding: "0.55rem 0.9rem", fontSize: "0.83rem", fontWeight: 600, color: C.text }}>{row.donorName}</td>
                    <td style={{ padding: "0.55rem 0.9rem", fontSize: "0.8rem", color: C.muted }}>{row.mobile}</td>
                    <td style={{ padding: "0.55rem 0.9rem", fontSize: "0.8rem", color: C.muted }}>{row.purposeNameEn || row.purposeNameHi}</td>
                    <td style={{ padding: "0.55rem 0.9rem", fontSize: "0.85rem", fontWeight: 700, color: C.text }}>₹{fmt(row.amount)}</td>
                    <td style={{ padding: "0.55rem 0.9rem", fontSize: "0.75rem", color: C.muted }}>{fmtDate(row.createdAt)}</td>
                    <td style={{ padding: "0.55rem 0.9rem" }}>
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                        {[
                          { label: t.view,  color: C.blue,   bg: C.blueBg,        onClick: () => navigate(`/donation/edit/${row.id}?mode=view`) },
                          { label: t.print, color: C.green,  bg: C.greenBg,       onClick: () => handlePrint(row) },
                          ...(isAdmin ? [
                            { label: t.update,  color: C.accent, bg: `${C.accent}15`, onClick: () => navigate(`/donation/edit/${row.id}`) },
                            { label: t.disable, color: C.red,    bg: C.redBg,         onClick: () => handleDisable(row) },
                          ] : []),
                        ].map(({ label, color, bg, onClick }) => (
                          <button key={label} onClick={onClick} style={{ padding: "0.28rem 0.65rem", background: bg, color, border: `1.5px solid ${color}30`, borderRadius: 6, fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = "#fff"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = bg; e.currentTarget.style.color = color; }}
                          >{label}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
