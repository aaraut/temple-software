import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Drawer,
  Chip,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PrintIcon from "@mui/icons-material/Print";

import { searchBookings, getBookingDetail, printBookingReceipt } from "../../api/roomBookingApi";
import { useAuth } from "../../context/AuthContext";
import { formatDateTime } from "../../utils/dateUtils";

const STATUS_COLOR = {
  CHECKED_IN: "warning", CHECKED_OUT: "success", ROOM_SHIFTED: "default",
  CANCELLED: "error", BOOKED: "info",
};

function InfoRow({ label, value }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.6, gap: 2 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right" }}>{value ?? "—"}</Typography>
    </Box>
  );
}

export default function BookingSearchPage() {
  const { language } = useAuth();

  const L = {
    en: {
      title: "Search Bookings", name: "Guest Name", mobile: "Mobile Number",
      bookingNo: "Receipt Number", search: "Search", noResults: "No results yet — try a search above.",
      room: "Room", guest: "Guest", status: "Status", checkIn: "Check-in", amount: "Amount",
      close: "Close", print: "Print Receipt", persons: "Persons", checkOut: "Check-out",
      base: "Base Amount", extraAmount: "Extra Amount", deposit: "Security Deposit",
      netPayable: "Net Payable", searching: "Searching...",
    },
    hi: {
      title: "बुकिंग खोजें", name: "अतिथि नाम", mobile: "मोबाइल नंबर",
      bookingNo: "रसीद क्रमांक", search: "खोजें", noResults: "अभी तक कोई परिणाम नहीं — ऊपर खोजें।",
      room: "कमरा", guest: "अतिथि", status: "स्थिति", checkIn: "चेक-इन", amount: "राशि",
      close: "बंद करें", print: "रसीद प्रिंट करें", persons: "व्यक्ति", checkOut: "चेक-आउट",
      base: "मूल राशि", extraAmount: "अतिरिक्त राशि", deposit: "सुरक्षा जमा",
      netPayable: "नेट भुगतान", searching: "खोजा जा रहा है...",
    },
  };
  const t = L[language] ?? L.en;

  const [form, setForm] = useState({ customerName: "", mobileNumber: "", bookingNumber: "" });
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [printing, setPrinting] = useState(false);

  const handleSearch = async () => {
    setError("");
    setSearching(true);
    try {
      const res = await searchBookings({
        customerName: form.customerName || null,
        mobileNumber: form.mobileNumber || null,
        bookingNumber: form.bookingNumber || null,
        status: null,
        fromDate: null,
        toDate: null,
      });
      setResults(res.data);
    } catch {
      setError(language === "hi" ? "खोज विफल" : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const openDetail = async (bookingNumber) => {
    setDetail(null);
    setLoadingDetail(true);
    try {
      const res = await getBookingDetail(bookingNumber);
      setDetail(res.data);
    } catch {
      setError(language === "hi" ? "विवरण लोड करने में विफल" : "Failed to load detail");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handlePrint = async () => {
    if (!detail) return;
    setPrinting(true);
    try {
      const res = await printBookingReceipt(detail.bookingNumber, language);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const win = window.open(url, "_blank");
      if (win) win.onload = () => win.print();
    } catch {
      setError(language === "hi" ? "रसीद प्रिंट करने में विफल" : "Failed to print receipt");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, margin: "auto", p: 2 }}>
      <Typography variant="h5" gutterBottom>{t.title}</Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField label={t.name} value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })} sx={{ minWidth: 200 }} />
          <TextField label={t.mobile} value={form.mobileNumber}
            onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} sx={{ minWidth: 200 }} />
          <TextField label={t.bookingNo} value={form.bookingNumber}
            onChange={(e) => setForm({ ...form, bookingNumber: e.target.value })} sx={{ minWidth: 200 }} />
          <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch} disabled={searching}>
            {searching ? t.searching : t.search}
          </Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {results === null ? (
        <Typography color="text.secondary">{t.noResults}</Typography>
      ) : results.length === 0 ? (
        <Typography color="text.secondary">{t.noResults}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{t.bookingNo}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t.room}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t.guest}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t.mobile}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t.status}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t.checkIn}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t.amount}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.bookingNumber} hover sx={{ cursor: "pointer" }}
                  onClick={() => openDetail(r.bookingNumber)}>
                  <TableCell>{r.bookingNumber}</TableCell>
                  <TableCell>{r.roomNumber}</TableCell>
                  <TableCell>{r.customerName}</TableCell>
                  <TableCell>{r.mobileNumber}</TableCell>
                  <TableCell>
                    <Chip size="small" label={r.status} color={STATUS_COLOR[r.status] || "default"} />
                  </TableCell>
                  <TableCell>{formatDateTime(r.scheduledCheckIn)}</TableCell>
                  <TableCell>₹{r.grossAmount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Drawer anchor="right" open={!!detail || loadingDetail} onClose={() => setDetail(null)}>
        <Box sx={{ width: 400, p: 3 }}>
          {loadingDetail ? (
            <CircularProgress sx={{ mt: 3 }} />
          ) : detail && (
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {t.room} {detail.roomNumber} · {detail.blockName}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Chip size="small" label={detail.status} color={STATUS_COLOR[detail.status] || "default"} />
                <Typography variant="caption" color="text.secondary">
                  {t.bookingNo}: {detail.bookingNumber}
                </Typography>
              </Box>

              <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1.5, mb: 2 }}>
                <InfoRow label={t.guest} value={detail.customerName} />
                <InfoRow label={t.mobile} value={detail.mobileNumber} />
                <InfoRow label={t.persons} value={detail.numPersons} />
                <InfoRow label={t.checkIn} value={formatDateTime(detail.actualCheckInTime)} />
                {detail.actualCheckOutTime && (
                  <InfoRow label={t.checkOut} value={formatDateTime(detail.actualCheckOutTime)} />
                )}
                <Divider sx={{ my: 1 }} />
                <InfoRow label={t.base} value={`₹${detail.baseAmount ?? 0}`} />
                <InfoRow label={t.extraAmount} value={`₹${detail.extraChargeAmount ?? 0}`} />
                <InfoRow label={t.deposit} value={`₹${detail.securityDeposit ?? 0}`} />
                <Divider sx={{ my: 1 }} />
                <InfoRow label={t.netPayable} value={`₹${detail.netPayableAmount ?? 0}`} />
              </Box>

              <Button fullWidth variant="outlined" startIcon={<PrintIcon />} disabled={printing}
                onClick={handlePrint} sx={{ mb: 2 }}>
                {t.print}
              </Button>

              <Button fullWidth onClick={() => setDetail(null)}>{t.close}</Button>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}
