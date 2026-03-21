import { useState, useEffect, useRef } from "react";
import {
  Box, TextField, Button, Snackbar, Alert,
  Paper, Typography, Divider, Tabs, Tab,
  Table, TableHead, TableRow, TableCell, TableBody,
  Chip, CircularProgress, IconButton
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import { getRentalByReceipt, returnRental, searchRentalsByMobile, searchRentalsByName } from "../../api/rentalApi";
import { useAuth } from "../../context/AuthContext";
import RentalReturnTable from "../../components/rental/RentalReturnTable";
import RentalSummaryCard from "../../components/rental/RentalSummaryCard";

const L = {
  hi: {
    title: "किराया वापसी",
    tabReceipt: "रसीद नंबर",
    tabMobile: "मोबाइल नंबर",
    tabName: "नाम से खोजें",
    receiptLabel: "रसीद नंबर",
    mobileLabel: "मोबाइल नंबर",
    nameLabel: "ग्राहक का नाम",
    namePlaceholder: "नाम के कुछ अक्षर टाइप करें...",
    search: "खोजें",
    fine: "जुर्माना / नुकसान",
    remarks: "टिप्पणी",
    submit: "वापसी दर्ज करें",
    back: "वापस",
    notFound: "रसीद नहीं मिली",
    noResults: "कोई रिकॉर्ड नहीं मिला",
    successReturn: "वापसी सफलतापूर्वक दर्ज हुई",
    errorReturn: "वापसी में त्रुटि",
    selectRecord: "रिकॉर्ड चुनें",
    useThis: "इसे चुनें",
    colReceipt: "रसीद",
    colName: "नाम",
    colMobile: "मोबाइल",
    colCategory: "श्रेणी",
    colStatus: "स्थिति",
    colDate: "दिनांक",
    colAction: "कार्य",
    bartan: "बर्तन",
    bichayat: "बिछायत",
    searching: "खोज रहे हैं...",
    errorMsgs: {
      "Rental already closed": "किराया पहले से बंद हो चुका है",
      "Rental already returned": "किराया पहले से वापस हो चुका है",
      "Receipt not found": "रसीद नहीं मिली",
      "Rental not found": "किराया नहीं मिला",
      "Invalid receipt number": "अमान्य रसीद नंबर",
    }
  },
  en: {
    title: "Rental Return",
    tabReceipt: "Receipt Number",
    tabMobile: "Mobile Number",
    tabName: "Search by Name",
    receiptLabel: "Receipt Number",
    mobileLabel: "Mobile Number",
    nameLabel: "Customer Name",
    namePlaceholder: "Type a few characters...",
    search: "Search",
    fine: "Fine / Loss",
    remarks: "Remarks",
    submit: "Submit Return",
    back: "Back",
    notFound: "Receipt not found",
    noResults: "No records found",
    successReturn: "Return submitted successfully",
    errorReturn: "Error in return submission",
    selectRecord: "Select Record",
    useThis: "Use This",
    colReceipt: "Receipt",
    colName: "Name",
    colMobile: "Mobile",
    colCategory: "Category",
    colStatus: "Status",
    colDate: "Date",
    colAction: "Action",
    bartan: "Bartan",
    bichayat: "Bichayat",
    searching: "Searching...",
    errorMsgs: {}
  }
};

const statusColor = {
  ACTIVE: "success", CLOSED: "default", PARTIAL: "warning"
};

export default function RentalReturnPage() {
  const { auth, language } = useAuth();
  const t = L[language] ?? L.en;

  const [tab, setTab] = useState(0);

  // Receipt search
  const [receiptNumber, setReceiptNumber] = useState("");

  // Mobile search
  const [mobile, setMobile] = useState("");

  // Name search with autocomplete
  const [nameQuery, setNameQuery] = useState("");
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [nameSearching, setNameSearching] = useState(false);
  const nameDebounce = useRef(null);
  const mobileDebounce = useRef(null);

  // Search results list (mobile / name)
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // The actual rental loaded for return
  const [rental, setRental] = useState(null);
  const [returnItems, setReturnItems] = useState({});
  const [fineAmount, setFineAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // ── Mobile live search debounce ────────────────────────────
  useEffect(() => {
    if (mobile.length < 4) { setSearchResults([]); return; }
    if (mobileDebounce.current) clearTimeout(mobileDebounce.current);
    mobileDebounce.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await searchRentalsByMobile(mobile.trim());
        setSearchResults(res);
        if (!res.length) setError(t.noResults);
        else setError("");
      } catch { setError(t.noResults); }
      finally { setSearchLoading(false); }
    }, 300);
  }, [mobile]);

  // ── Name autocomplete debounce ──────────────────────────────
  useEffect(() => {
    if (nameQuery.length < 2) { setNameSuggestions([]); return; }
    if (nameDebounce.current) clearTimeout(nameDebounce.current);
    nameDebounce.current = setTimeout(async () => {
      setNameSearching(true);
      try {
        const res = await searchRentalsByName(nameQuery);
        // Unique names for suggestion list
        const unique = [...new Map(res.map(r => [r.customerName, r])).values()];
        setNameSuggestions(unique.slice(0, 8));
      } catch { setNameSuggestions([]); }
      finally { setNameSearching(false); }
    }, 300);
  }, [nameQuery]);

  // ── Load list by mobile ─────────────────────────────────────
  const handleMobileSearch = async () => {
    setError(""); setSearchResults([]); setRental(null);
    if (!mobile.trim()) return;
    setSearchLoading(true);
    try {
      const res = await searchRentalsByMobile(mobile.trim());
      if (!res.length) setError(t.noResults);
      setSearchResults(res);
    } catch { setError(t.noResults); }
    finally { setSearchLoading(false); }
  };

  // ── Load list by name ───────────────────────────────────────
  const handleNameSearch = async (name) => {
    setError(""); setSearchResults([]); setRental(null);
    setNameQuery(name); setNameSuggestions([]);
    setSearchLoading(true);
    try {
      const res = await searchRentalsByName(name);
      if (!res.length) setError(t.noResults);
      setSearchResults(res);
    } catch { setError(t.noResults); }
    finally { setSearchLoading(false); }
  };

  // ── Load receipt directly ───────────────────────────────────
  const searchByReceipt = async () => {
    setError(""); setRental(null);
    try {
      const resp = await getRentalByReceipt(receiptNumber.trim());
      setRental(resp); setReturnItems({});
    } catch {
      setRental(null); setError(t.notFound);
    }
  };

  // ── Select a record from search results ────────────────────
  const handleSelectRecord = async (receipt) => {
    setError("");
    try {
      const resp = await getRentalByReceipt(receipt);
      setRental(resp); setReturnItems({});
      setSearchResults([]);
    } catch (e) {
      setError(t.errorMsgs[e.response?.data?.message] || e.response?.data?.message || t.notFound);
    }
  };

  // ── Submit return ───────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      await returnRental({
        receiptNumber: rental.receiptNumber,
        fineAmount: fineAmount || 0,
        remarks,
        handledBy: auth.username,
        items: Object.values(returnItems)
      });
      setSuccess(t.successReturn);
      setRental(null); setReceiptNumber(""); setMobile(""); setNameQuery("");
      setSearchResults([]);
    } catch (e) {
      setError(t.errorMsgs[e.response?.data?.message] || e.response?.data?.message || t.errorReturn);
    }
  };

  const handleBack = () => {
    setRental(null); setReturnItems({}); setFineAmount(""); setRemarks("");
  };

  const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString("en-IN") : "-";
  const categoryLabel = (cat) => cat === "BARTAN" ? t.bartan : t.bichayat;

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", p: 2 }}>
      <Typography variant="h6" fontWeight={600} mb={2}>{t.title}</Typography>

      {/* ── If rental is loaded, show return form ── */}
      {rental ? (
        <>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
            {t.back}
          </Button>

          <RentalSummaryCard rental={rental} />

          <Box sx={{ mt: 2 }}>
            <RentalReturnTable rental={rental} onChange={setReturnItems} language={language} />
          </Box>

          <Paper sx={{ mt: 2, p: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }} variant="outlined">
            <TextField size="small" label={t.fine} type="number" value={fineAmount} onChange={(e) => setFineAmount(e.target.value)} />
            <TextField size="small" label={t.remarks} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            <Box sx={{ gridColumn: "1 / -1", textAlign: "right" }}>
              <Button size="small" variant="contained" onClick={handleSubmit}>{t.submit}</Button>
            </Box>
          </Paper>
        </>
      ) : (
        <>
          {/* ── Search Tabs ── */}
          <Paper variant="outlined" sx={{ borderRadius: 2 }}>
            <Tabs value={tab} onChange={(_, v) => {
              setTab(v);
              setSearchResults([]);
              setError("");
              setReceiptNumber("");
              setMobile("");
              setNameQuery("");
              setNameSuggestions("");
              setRental(null);
            }} sx={{ borderBottom: "1px solid #eee" }}>
              <Tab label={t.tabReceipt} />
              <Tab label={t.tabMobile} />
              <Tab label={t.tabName} />
            </Tabs>

            <Box sx={{ p: 2 }}>
              {/* Tab 0: Receipt */}
              {tab === 0 && (
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <TextField
                    size="small" label={t.receiptLabel} value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchByReceipt()}
                    sx={{ width: 260 }}
                  />
                  <Button variant="contained" startIcon={<SearchIcon />} onClick={searchByReceipt}>{t.search}</Button>
                </Box>
              )}

              {/* Tab 1: Mobile */}
              {tab === 1 && (
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <TextField
                    size="small" label={t.mobileLabel} value={mobile}
                    onChange={(e) => { setMobile(e.target.value); setError(""); setSearchResults([]); }}
                    inputProps={{ maxLength: 10 }}
                    sx={{ width: 260 }}
                    placeholder="e.g. 9860"
                  />
                  {searchLoading && tab === 1 && <CircularProgress size={20} />}
                </Box>
              )}

              {/* Tab 2: Name with autocomplete */}
              {tab === 2 && (
                <Box sx={{ position: "relative", width: 340 }}>
                  <TextField
                    size="small" fullWidth label={t.nameLabel}
                    placeholder={t.namePlaceholder}
                    value={nameQuery}
                    onChange={(e) => { setNameQuery(e.target.value); setSearchResults([]); setError(""); }}
                    InputProps={{ endAdornment: nameSearching && <CircularProgress size={16} /> }}
                    autoComplete="off"
                  />
                  {/* Suggestions dropdown — rendered outside Paper flow to avoid clipping */}
                  {nameSuggestions.length > 0 && (
                    <Paper
                      elevation={6}
                      sx={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        right: 0,
                        zIndex: 1300,
                        maxHeight: 240,
                        overflowY: "auto",
                        border: "1px solid #ddd",
                        borderRadius: 1,
                      }}
                    >
                      {nameSuggestions.map((s) => (
                        <Box
                          key={s.receiptNumber}
                          onClick={() => handleNameSearch(s.customerName)}
                          sx={{
                            px: 2, py: 1.2, cursor: "pointer",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            fontSize: "0.9rem", borderBottom: "1px solid #f0f0f0",
                            "&:hover": { background: "#f5f0ff" },
                            "&:last-child": { borderBottom: "none" }
                          }}
                        >
                          <span>{s.customerName}</span>
                          <Typography variant="caption" color="text.secondary">{s.mobile}</Typography>
                        </Box>
                      ))}
                    </Paper>
                  )}
                </Box>
              )}
            </Box>
          </Paper>

          {/* ── Search Results List ── */}
          {searchLoading && <Box sx={{ textAlign: "center", mt: 3 }}><CircularProgress /></Box>}

          {searchResults.length > 0 && (
            <Paper variant="outlined" sx={{ mt: 2, borderRadius: 2, overflow: "hidden" }}>
              <Box sx={{ p: 2, borderBottom: "1px solid #eee" }}>
                <Typography fontWeight={600}>{t.selectRecord} ({searchResults.length})</Typography>
              </Box>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#7a1f1f" }}>
                  <TableRow>
                    <TableCell sx={{ color: "white" }}>{t.colReceipt}</TableCell>
                    <TableCell sx={{ color: "white" }}>{t.colName}</TableCell>
                    <TableCell sx={{ color: "white" }}>{t.colMobile}</TableCell>
                    <TableCell sx={{ color: "white" }}>{t.colCategory}</TableCell>
                    <TableCell sx={{ color: "white" }}>{t.colStatus}</TableCell>
                    <TableCell sx={{ color: "white" }}>{t.colDate}</TableCell>
                    <TableCell sx={{ color: "white" }} align="center">{t.colAction}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {searchResults.map((r, idx) => (
                    <TableRow key={r.receiptNumber} sx={{ backgroundColor: idx % 2 ? "#fafafa" : "white", "&:hover": { backgroundColor: "#f0f0f0" } }}>
                      <TableCell sx={{ fontFamily: "monospace", fontWeight: 600 }}>{r.receiptNumber}</TableCell>
                      <TableCell>{r.customerName}</TableCell>
                      <TableCell>{r.mobile}</TableCell>
                      <TableCell>{categoryLabel(r.category)}</TableCell>
                      <TableCell>
                        <Chip label={r.status} color={statusColor[r.status] ?? "default"} size="small" />
                      </TableCell>
                      <TableCell>{formatDate(r.createdAt)}</TableCell>
                      <TableCell align="center">
                        <Button size="small" variant="contained" onClick={() => handleSelectRecord(r.receiptNumber)}>
                          {t.useThis}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </>
      )}

      <Snackbar open={!!success} autoHideDuration={8000} onClose={() => setSuccess("")}>
        <Alert severity="success">{success}</Alert>
      </Snackbar>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
}
