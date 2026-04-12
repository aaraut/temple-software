import { useEffect, useState } from "react";
import { Box, Typography, Divider, Snackbar, Alert } from "@mui/material";
import {
  createBooking, printBookingReceipt, getBookingDetail, checkInBooking, checkoutBooking, shiftRoom, getAvailability, searchBookings,
} from "../../api/roomBookingApi";
import { getRooms } from "../../api/roomApi";
import { useAuth } from "../../context/AuthContext";

const nowLocal = () => {
  const d = new Date(); d.setSeconds(0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const nextDayCheckout = (checkInStr) => {
  if (!checkInStr) return "";
  const d = new Date(checkInStr);
  d.setDate(d.getDate() + 1);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T10:00`;
};

// Input sanitizers — strip to allowed chars only
const sanitizers = {
  name:    (v) => v.replace(/[^a-zA-Zऀ-ॿ\s.'-]/g, "").slice(0, 60),
  mobile:  (v) => v.replace(/[^0-9]/g, "").slice(0, 10),
  idProof: (v) => v.replace(/[^a-zA-Z0-9\s-]/g, "").slice(0, 20),
  booking: (v) => v.replace(/[^A-Z0-9-]/g, "").slice(0, 25),
  number:  (v) => v.replace(/[^0-9.]/g, "").slice(0, 8),
};

const C = {
  bg: "#fdf9f4", card: "#ffffff", border: "#e8ddd0",
  borderFocus: "#c8894a", accent: "#c8894a", accentDark: "#a86830",
  text: "#2d1f0f", textMuted: "#8a7560",
};

const inputBase = (readOnly) => ({
  width: "100%", boxSizing: "border-box",
  padding: "10px 12px", border: `1.5px solid ${C.border}`,
  borderRadius: 8, fontSize: 14,
  fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  background: readOnly ? "#faf8f5" : "#fff",
  color: readOnly ? "#5a4a3a" : C.text, outline: "none",
  transition: "border-color 0.18s",
});

const FieldLabel = ({ children }) => (
  <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.text, letterSpacing: 0.3, mb: 0.5, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
    {children}
  </Typography>
);

const Field = ({ label, name, value, onChange, type = "text", min, readOnly, maxLength, placeholder }) => (
  <Box>
    <FieldLabel>{label}</FieldLabel>
    <input
      type={type} name={name} value={value} onChange={onChange}
      min={min} readOnly={readOnly} maxLength={maxLength} placeholder={placeholder}
      style={inputBase(readOnly)}
      onFocus={(e) => { if (!readOnly) e.target.style.borderColor = C.borderFocus; }}
      onBlur={(e) => { e.target.style.borderColor = C.border; }}
    />
  </Box>
);

const StyledSelect = ({ label, name, value, onChange, disabled, children }) => (
  <Box>
    <FieldLabel>{label}</FieldLabel>
    <select
      name={name} value={value} onChange={onChange} disabled={disabled}
      style={{
        ...inputBase(disabled), cursor: disabled ? "not-allowed" : "pointer",
        appearance: "none", paddingRight: 32,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%238a7560' d='M5 7L0 2h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      }}
    >
      {children}
    </select>
  </Box>
);

const SectionHead = ({ children }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
    <Box sx={{ width: 3, height: 18, background: C.accent, borderRadius: 2 }} />
    <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: C.accent }}>
      {children}
    </Typography>
  </Box>
);

const ActionBtn = ({ label, icon, onClick, disabled, colorSet }) => {
  const sets = {
    green:  { bg: "#f0faf0", color: "#2d7a2d", border: "#b8ddb8" },
    red:    { bg: "#fff5f5", color: "#b03030", border: "#e8c0c0" },
    blue:   { bg: "#f5f5ff", color: "#4040b0", border: "#c0c0e8" },
    tan:    { bg: "#fdf6ee", color: "#8a7560", border: "#e8ddd0" },
  };
  const s = disabled ? { bg: "#f5f2ee", color: "#c0b8b0", border: "#e8e0d8" } : (sets[colorSet] || sets.tan);
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", padding: "11px 16px",
      background: s.bg, color: s.color, border: `1.5px solid ${s.border}`,
      borderRadius: 8, fontSize: 13, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      textAlign: "left", display: "flex", alignItems: "center", gap: 10,
      transition: "all 0.15s", opacity: disabled ? 0.65 : 1,
    }}>
      <span style={{ fontSize: 17 }}>{icon}</span>{label}
    </button>
  );
};

export default function RoomBookingPage() {
  const { auth, language } = useAuth();

  const L = {
    hi: {
      pageTitle: "भक्त निवास", pageSubtitle: "बुकिंग",
      createBooking: "नई बुकिंग", bookingConfirmed: "बुकिंग सफल — फॉर्म लॉक",
      selectRoom: "— कमरा चुनें —", customerName: "अतिथि नाम",
      mobile: "मोबाइल नंबर", idProofType: "पहचान पत्र प्रकार",
      idProofNumber: "पहचान पत्र नंबर", bookingType: "बुकिंग प्रकार",
      checkIn: "चेक-इन", checkOut: "चेक-आउट (10:00 AM)",
      surcharge: "अतिरिक्त सरचार्ज (₹)", extraCharge: "अतिरिक्त शुल्क (₹)",
      deposit: "सुरक्षा जमा (₹)", grossAmount: "कुल राशि",
      createBtn: "बुकिंग बनाएं", createdBtn: "✓ बुकिंग दर्ज", resetBtn: "↺ रीसेट",
      actions: "कार्रवाई", bookingNumber: "बुकिंग नंबर",
      searchLink: "🔍 नाम / मोबाइल से खोजें",
      checkInBtn: "चेक-इन", checkoutBtn: "चेकआउट",
      shiftBtn: "कमरा बदलें", availBtn: "उपलब्धता देखें",
      statusBooked: "⏳ चेक-इन की प्रतीक्षा", statusCheckedIn: "✅ अतिथि चेक-इन हो गए",
      statusCheckedOut: "🏁 चेकआउट हो गया",
      checkAvailTitle: "कमरा उपलब्धता", searchAvail: "उपलब्धता खोजें",
      roomsFound: (n) => `${n} कमरे मिले`,
      available: "✓ उपलब्ध", occupied: "✗ व्यस्त",
      dirty: "⚠ गंदा", cleaning: "⚠ सफाई जारी",
      dirtyWarn: "कृपया चेक-इन से पहले हाउसकीपिंग से कमरे की स्थिति अपडेट करवाएं।",
      selectRoom2: "चुनें",
      searchBooking: "बुकिंग खोजें", searchMobile: "मोबाइल नंबर",
      searchName: "अतिथि नाम", searchBtn: "खोजें",
      bookingsFound: (n) => `${n} बुकिंग मिली`,
      selectBooking: "✓ चुनें", printReceipt: "🖨 प्रिंट",
      aadhar: "आधार", drivingLicense: "ड्राइविंग लाइसेंस", govtId: "सरकारी पहचान पत्र",
      twentyFourHour: "24 घंटे", fixedSlot: "फिक्स्ड स्लॉट",
      threeHour: "3 घंटे", sixHour: "6 घंटे",
    },
    en: {
      pageTitle: "Bhakt Niwas", pageSubtitle: "Room Booking",
      createBooking: "Create Booking", bookingConfirmed: "Booking Confirmed — Form Locked",
      selectRoom: "— Select Room —", customerName: "Customer Name",
      mobile: "Mobile Number", idProofType: "ID Proof Type",
      idProofNumber: "ID Proof Number", bookingType: "Booking Type",
      checkIn: "Check-In", checkOut: "Check-Out (10:00 AM)",
      surcharge: "Extra Surcharge (₹)", extraCharge: "Extra Charge (₹)",
      deposit: "Security Deposit (₹)", grossAmount: "Gross Amount",
      createBtn: "Create Booking", createdBtn: "✓ Created", resetBtn: "↺ Reset",
      actions: "Actions", bookingNumber: "Booking Number",
      searchLink: "🔍 Search by Name / Mobile",
      checkInBtn: "Check-In", checkoutBtn: "Checkout",
      shiftBtn: "Shift Room", availBtn: "Check Availability",
      statusBooked: "⏳ Awaiting Check-In", statusCheckedIn: "✅ Guest Checked In",
      statusCheckedOut: "🏁 Checked Out",
      checkAvailTitle: "Room Availability", searchAvail: "Search Availability",
      roomsFound: (n) => `${n} room(s) found`,
      available: "✓ Available", occupied: "✗ Occupied",
      dirty: "⚠ Dirty", cleaning: "⚠ Cleaning in Progress",
      dirtyWarn: "Please ask housekeeping to update room status before check-in.",
      selectRoom2: "Select",
      searchBooking: "Search Booking", searchMobile: "Mobile Number",
      searchName: "Customer Name", searchBtn: "Search",
      bookingsFound: (n) => `${n} booking(s) found`,
      selectBooking: "✓ Select", printReceipt: "🖨 Print",
      aadhar: "Aadhar", drivingLicense: "Driving License", govtId: "Govt ID",
      twentyFourHour: "24 Hour", fixedSlot: "Fixed Slot",
      threeHour: "3 Hour", sixHour: "6 Hour",
    },
  };
  const t = L[language] ?? L.en;

  const [rooms, setRooms]           = useState([]);
  const [success, setSuccess]       = useState("");
  const [error, setError]           = useState("");
  const [bookingNumber, setBookingNumber] = useState("");
  const [bookingCreatedOverride, setBookingCreatedOverride] = useState(false);
  const bookingCreated = !!bookingNumber || bookingCreatedOverride;

  const [bookingStatus, setBookingStatus] = useState(""); // BOOKED | CHECKED_IN | CHECKED_OUT

  // Availability modal state
  const [availModal, setAvailModal]     = useState(false);
  const [availFrom, setAvailFrom]       = useState(nowLocal());
  const [availTo, setAvailTo]           = useState(nextDayCheckout(nowLocal()));
  const [availResults, setAvailResults] = useState([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError]     = useState("");

  // ── Booking search state ──────────────────────────────────────────────────
  const [searchModal, setSearchModal]     = useState(false);
  const [searchQuery, setSearchQuery]     = useState({ mobile: "", name: "" });
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError]     = useState("");

  const handleBookingSearch = async () => {
    if (!searchQuery.mobile.trim() && !searchQuery.name.trim()) {
      setSearchError("Please enter mobile number or customer name");
      return;
    }
    setSearchError(""); setSearchLoading(true);
    try {
      const res = await searchBookings({
        mobileNumber: searchQuery.mobile.trim() || undefined,
        customerName: searchQuery.name.trim()   || undefined,
      });
      setSearchResults(res.data);
      if (res.data.length === 0) setSearchError("No bookings found");
    } catch { setSearchError("Search failed. Please try again."); }
    finally { setSearchLoading(false); }
  };

  const toLocalDt = (v) => {
    if (!v) return "";
    if (Array.isArray(v)) {
      const [yr, mo, d, h = 0, m = 0] = v;
      const pad = (n) => String(n).padStart(2, "0");
      return `${yr}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(m)}`;
    }
    return String(v).slice(0, 16); // ISO string → "YYYY-MM-DDTHH:mm"
  };

  const handleSelectBooking = async (bk) => {
    setBookingNumber(bk.bookingNumber);
    setBookingStatus(bk.status);
    setSearchModal(false);
    setSearchResults([]);
    setSearchQuery({ mobile: "", name: "" });
    setSearchError("");

    // Fetch full booking detail to populate the left form
    try {
      const res = await getBookingDetail(bk.bookingNumber);
      const d = res.data;
      setForm({
        roomId:                d.roomId             ?? "",
        customerName:          d.customerName        ?? "",
        mobileNumber:          d.mobileNumber        ?? "",
        idProofType:           d.idProofType         ?? "AADHAR",
        idProofNumber:         d.idProofNumber       ?? "",
        bookingType:           d.bookingType         ?? "TWENTY_FOUR_HOUR",
        scheduledCheckIn:      toLocalDt(d.scheduledCheckIn),
        scheduledCheckOut:     toLocalDt(d.scheduledCheckOut),
        extraSurchargeAmount:  d.extraSurchargeAmount ?? 0,
        extraChargeAmount:     d.extraChargeAmount   ?? 0,
        securityDeposit:       d.securityDeposit     ?? 0,
      });
      // Lock the form since this is an existing booking
      setBookingCreatedOverride(true);
    } catch {
      // Non-critical — booking number + status already set, form stays editable
    }
  };

  const handleCheckAvailability = async () => {
    if (!availFrom || !availTo) { setAvailError("Please select both dates"); return; }
    if (new Date(availTo) <= new Date(availFrom)) { setAvailError("Check-out must be after check-in"); return; }
    setAvailError(""); setAvailLoading(true);
    try {
      const res = await getAvailability(availFrom, availTo);
      setAvailResults(res.data);
    } catch { setAvailError("Failed to fetch availability"); }
    finally { setAvailLoading(false); }
  };

  const handleSelectRoom = (room) => {
    setForm((prev) => ({ ...prev, roomId: room.roomId }));
    setAvailModal(false);
    setAvailResults([]);
  };

  const [form, setForm] = useState({
    roomId: "", customerName: "", mobileNumber: "",
    idProofType: "AADHAR", idProofNumber: "",
    bookingType: "TWENTY_FOUR_HOUR",
    scheduledCheckIn: nowLocal(),
    scheduledCheckOut: nextDayCheckout(nowLocal()),
    extraSurchargeAmount: 0, extraChargeAmount: 0, securityDeposit: 0,
  });

  const [grossAmount, setGrossAmount] = useState(0);

  // Create button only enabled when all required fields are filled
  const formReady =
    !!form.roomId &&
    form.customerName.trim().length > 0 &&
    /^[0-9]{10}$/.test(form.mobileNumber) &&
    form.idProofNumber.trim().length > 0 &&
    !!form.scheduledCheckIn &&
    !!form.scheduledCheckOut;

  useEffect(() => {
    getRooms().then(setRooms).catch(() => setError("Failed to load rooms"));
  }, []);

  const selectedRoom = rooms.find((r) => r.id === Number(form.roomId));

  useEffect(() => {
    if (!selectedRoom) return;
    const base = selectedRoom.baseRent24Hr || 0;
    setGrossAmount(Number(base) + Number(form.extraSurchargeAmount || 0) + Number(form.extraChargeAmount || 0));
  }, [form, selectedRoom]);

  const sanitize = (name, value) => {
    if (name === "customerName")       return sanitizers.name(value);
    if (name === "mobileNumber")       return sanitizers.mobile(value);
    if (name === "idProofNumber")      return sanitizers.idProof(value);
    if (name === "extraSurchargeAmount" || name === "extraChargeAmount" || name === "securityDeposit")
                                       return sanitizers.number(value);
    return value; // dates, selects — pass through unchanged
  };

  const handleChange = (e) => {
    if (bookingCreated) return;
    const { name, value } = e.target;
    const clean = sanitize(name, value);
    setForm((prev) => {
      const u = { ...prev, [name]: clean };
      if (name === "scheduledCheckIn")           u.scheduledCheckOut = nextDayCheckout(clean);
      if (name === "scheduledCheckOut" && clean) u.scheduledCheckOut = clean.slice(0, 11) + "10:00";
      return u;
    });
  };

  const validate = () => {
    if (!form.roomId)                            { setError("Please select a room"); return false; }
    if (!form.customerName.trim())               { setError("Please enter customer name"); return false; }
    if (!/^[0-9]{10}$/.test(form.mobileNumber)) { setError("Enter a valid 10-digit mobile number"); return false; }
    if (!form.idProofNumber.trim())              { setError("Please enter ID proof number"); return false; }
    if (!form.scheduledCheckIn)                  { setError("Please select check-in time"); return false; }
    if (!form.scheduledCheckOut)                 { setError("Please select check-out time"); return false; }
    if (new Date(form.scheduledCheckOut) <= new Date(form.scheduledCheckIn)) {
      setError("Check-out must be after check-in"); return false;
    }
    return true;
  };

  const handleReset = () => {
    setForm({
      roomId: "", customerName: "", mobileNumber: "",
      idProofType: "AADHAR", idProofNumber: "",
      bookingType: "TWENTY_FOUR_HOUR",
      scheduledCheckIn: nowLocal(),
      scheduledCheckOut: nextDayCheckout(nowLocal()),
      extraSurchargeAmount: 0, extraChargeAmount: 0, securityDeposit: 0,
    });
    setGrossAmount(0);
    setBookingNumber("");
    setBookingStatus("");
    setBookingCreatedOverride(false);
    setError("");
    setSuccess("");
  };

  const handleCreate = async () => {
    setError("");
    setBookingCreatedOverride(false);
    if (!validate()) return;
    try {
      // Step 1: Create booking — returns booking number string
      const res = await createBooking({ ...form, createdBy: auth.username });
      const bkNum = res.data;
      setBookingNumber(bkNum);
      setBookingStatus("BOOKED");
      setSuccess("Booking created: " + bkNum);

      // Step 2: Fetch receipt PDF and open print dialog
      const pdfRes = await printBookingReceipt(bkNum);
      const blobUrl = URL.createObjectURL(new Blob([pdfRes.data], { type: "application/pdf" }));
      const printWindow = window.open(blobUrl, "_blank");
      if (printWindow) {
        printWindow.addEventListener("load", () => {
          printWindow.print();
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        });
      }
    } catch (e) { setError(e.response?.data?.message || "Create failed"); }
  };

  const handleCheckIn = async () => {
    try {
      await checkInBooking({ bookingNumber, handledBy: auth.username });
      setBookingStatus("CHECKED_IN");
      setSuccess("Checked-in successfully");
    } catch (e) { setError(e.response?.data?.message || "Check-in failed"); }
  };

  const handleCheckout = async () => {
    try {
      await checkoutBooking({ bookingNumber, extraChargeAmount: form.extraChargeAmount, deductionFromDeposit: 0, remarks: "Normal checkout", handledBy: auth.username });
      setBookingStatus("CHECKED_OUT");
      setSuccess("Checked-out successfully");
    } catch (e) { setError(e.response?.data?.message || "Checkout failed"); }
  };

  const handleShift = async () => {
    try {
      const res = await shiftRoom({ oldBookingNumber: bookingNumber, newRoomId: form.roomId, newScheduledCheckIn: form.scheduledCheckIn, newScheduledCheckOut: form.scheduledCheckOut, extraChargeAmount: form.extraChargeAmount, deductionFromDeposit: 0, handledBy: auth.username });
      setBookingNumber(res.data); setSuccess("Shifted to: " + res.data);
    } catch (e) { setError(e.response?.data?.message || "Shift failed"); }
  };



  const minCheckIn  = nowLocal();
  const minCheckOut = form.scheduledCheckIn
    ? new Date(new Date(form.scheduledCheckIn).getTime() + 60000).toISOString().slice(0, 16)
    : minCheckIn;

  return (
    <Box sx={{ minHeight: "100vh", background: C.bg, p: { xs: 2, md: 3 }, fontFamily: "'Georgia', serif" }}>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: C.accent, mb: 0.3 }}>
          {t.pageTitle}
        </Typography>
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: C.text }}>
          {t.pageSubtitle}
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.6fr 1fr" }, gap: 2.5, alignItems: "start" }}>

        {/* ══ LEFT: Create Booking ══ */}
        <Box sx={{ background: C.card, borderRadius: 3, border: `1px solid ${C.border}`, p: 3, boxShadow: "0 2px 10px rgba(139,100,60,0.07)" }}>

          {/* Availability checker trigger */}
          <Box sx={{ mb: 2.5 }}>
            <button
              onClick={() => { setAvailModal(true); setAvailResults([]); setAvailError(""); }}
              style={{
                padding: "8px 18px", background: "#fdf6ee",
                border: `1.5px solid ${C.border}`, borderRadius: 8,
                fontSize: 12, fontWeight: 600, color: C.textMuted,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
            >
              <span style={{ fontSize: 15 }}>📅</span> {t.availBtn}
            </button>
          </Box>

          {/* ── Availability Modal ── */}
          {availModal && (
            <Box sx={{
              position: "fixed", inset: 0, zIndex: 1300,
              background: "rgba(45,31,15,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }} onClick={() => setAvailModal(false)}>
              <Box onClick={(e) => e.stopPropagation()} sx={{
                background: "#fff", borderRadius: 3, p: 3,
                width: { xs: "92vw", sm: 520 }, maxHeight: "80vh",
                overflow: "auto", boxShadow: "0 8px 40px rgba(45,31,15,0.25)",
                border: `1px solid ${C.border}`,
              }}>
                {/* Modal header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 3, height: 18, background: C.accent, borderRadius: 2 }} />
                    <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: C.accent }}>
                      {t.checkAvailTitle}
                    </Typography>
                  </Box>
                  <button onClick={() => setAvailModal(false)} style={{
                    background: "none", border: "none", fontSize: 18,
                    cursor: "pointer", color: C.textMuted, lineHeight: 1,
                  }}>✕</button>
                </Box>

                {/* Date inputs */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                  <Field label={t.checkIn} name="availFrom" value={availFrom}
                    onChange={(e) => setAvailFrom(e.target.value)} type="datetime-local" min={nowLocal()} />
                  <Field label="Check-Out" name="availTo" value={availTo}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAvailTo(v ? v.slice(0, 11) + "10:00" : v);
                    }} type="datetime-local" min={availFrom} />
                </Box>

                {availError && (
                  <Box sx={{ mb: 1.5, p: 1.5, background: "#fff5f5", border: "1px solid #e8c0c0", borderRadius: 2 }}>
                    <Typography sx={{ fontSize: 12, color: "#b03030" }}>{availError}</Typography>
                  </Box>
                )}

                <button
                  onClick={handleCheckAvailability}
                  disabled={availLoading}
                  style={{
                    width: "100%", padding: "10px", mb: 2,
                    background: availLoading ? "#e8e0d8" : `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
                    color: availLoading ? "#aaa" : "#fff",
                    border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
                    cursor: availLoading ? "not-allowed" : "pointer",
                    marginBottom: 16,
                  }}
                >
                  {availLoading ? t.searching : t.searchAvail}
                </button>

                {/* Results */}
                {availResults.length > 0 && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", mb: 0.5 }}>
                      {t.roomsFound(availResults.length)}
                    </Typography>
                    {availResults.map((room) => {
                      const dirty = room.cleaningStatus === "DIRTY" || room.cleaningStatus === "CLEANING_IN_PROGRESS";
                      const available = room.available;
                      return (
                        <Box key={room.roomId} sx={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          p: 1.5, borderRadius: 2,
                          border: `1px solid ${available ? (dirty ? "#f0d080" : "#b8ddb8") : "#e8c0c0"}`,
                          background: available ? (dirty ? "#fffbf0" : "#f0faf0") : "#fff5f5",
                        }}>
                          <Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                              Room {room.roomNumber} · Block {room.blockName}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1, mt: 0.3, flexWrap: "wrap" }}>
                              <Typography sx={{
                                fontSize: 10, fontWeight: 700, px: 1, py: 0.2, borderRadius: 1,
                                background: available ? "#d0f0d0" : "#f0d0d0",
                                color: available ? "#2d7a2d" : "#b03030",
                              }}>
                                {available ? t.available : t.occupied}
                              </Typography>
                              {dirty && (
                                <Typography sx={{
                                  fontSize: 10, fontWeight: 700, px: 1, py: 0.2, borderRadius: 1,
                                  background: "#fff0c0", color: "#9a7020",
                                }}>
                                  ⚠ {room.cleaningStatus === "CLEANING_IN_PROGRESS" ? "Cleaning in Progress" : "Dirty — Needs Cleaning"}
                                </Typography>
                              )}
                            </Box>
                            {available && dirty && (
                              <Typography sx={{ fontSize: 11, color: "#9a7020", mt: 0.5 }}>
                                Please ask housekeeping to update room status before check-in.
                              </Typography>
                            )}
                          </Box>
                          {available && (
                            <button
                              onClick={() => handleSelectRoom(room)}
                              style={{
                                padding: "7px 14px", marginLeft: 12, flexShrink: 0,
                                background: dirty ? "#fff0c0" : `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
                                color: dirty ? "#9a7020" : "#fff",
                                border: `1px solid ${dirty ? "#f0d080" : "transparent"}`,
                                borderRadius: 6, fontSize: 12, fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              {t.selectRoom2}
                            </button>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Box>
          )}

          <SectionHead>{t.createBooking}</SectionHead>

          {bookingCreated && (
            <Box sx={{ background: "#f0faf0", border: "1px solid #b8ddb8", borderRadius: 2, p: 1.5, mb: 2.5, display: "flex", alignItems: "center", gap: 1.5 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#2d7a2d" }}>{t.bookingConfirmed}</Typography>
                <Typography sx={{ fontSize: 14, color: "#2d7a2d", fontFamily: "monospace", letterSpacing: 1 }}>{bookingNumber}</Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <StyledSelect label="Room" name="roomId" value={form.roomId} onChange={handleChange} disabled={bookingCreated}>
                <option value="">— Select Room —</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.roomNumber} · Block {r.blockName}</option>)}
              </StyledSelect>
              <Field label={t.customerName} name="customerName" value={form.customerName} onChange={handleChange} readOnly={bookingCreated} placeholder="Full name" />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
              <Field label={t.mobile} name="mobileNumber" value={form.mobileNumber} onChange={handleChange} readOnly={bookingCreated} maxLength={10} placeholder="10 digits" />
              <StyledSelect label={t.idProofType} name="idProofType" value={form.idProofType} onChange={handleChange} disabled={bookingCreated}>
                <option value="AADHAR">{t.aadhar}</option>
                <option value="DRIVING_LICENSE">{t.drivingLicense}</option>
                <option value="GOVT_ID">{t.govtId}</option>
              </StyledSelect>
              <Field label={t.idProofNumber} name="idProofNumber" value={form.idProofNumber} onChange={handleChange} readOnly={bookingCreated} placeholder="ID number" />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
              <Field label={t.checkIn} name="scheduledCheckIn" value={form.scheduledCheckIn} onChange={handleChange} type="datetime-local" min={minCheckIn} readOnly={bookingCreated} />
              <Field label={t.checkOut} name="scheduledCheckOut" value={form.scheduledCheckOut} onChange={handleChange} type="datetime-local" min={minCheckOut} readOnly={bookingCreated} />
              <StyledSelect label={t.bookingType} name="bookingType" value={form.bookingType} onChange={handleChange} disabled>
                <option value="TWENTY_FOUR_HOUR">{t.twentyFourHour}</option>
                <option value="FIXED_SLOT">{t.fixedSlot}</option>
                <option value="THREE_HOUR">{t.threeHour}</option>
                <option value="SIX_HOUR">{t.sixHour}</option>
              </StyledSelect>
            </Box>

            <Divider sx={{ borderColor: "#f0e8dc" }} />

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
              <Field label={t.surcharge} name="extraSurchargeAmount" value={form.extraSurchargeAmount} onChange={handleChange} type="number" readOnly={bookingCreated} />
              <Field label={t.extraCharge} name="extraChargeAmount" value={form.extraChargeAmount} onChange={handleChange} type="number" readOnly={bookingCreated} />
              <Field label={t.deposit} name="securityDeposit" value={form.securityDeposit} onChange={handleChange} type="number" readOnly={bookingCreated} />
            </Box>

            {/* Gross + Create */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fdf6ee", borderRadius: 2, px: 2.5, py: 1.5, border: `1px solid ${C.border}` }}>
              <Box>
                <Typography sx={{ fontSize: 10, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>{t.grossAmount}</Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: C.accent, fontFamily: "monospace" }}>
                  ₹ {grossAmount.toLocaleString("en-IN")}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <button
                  onClick={handleCreate}
                  disabled={bookingCreated || !formReady}
                  style={{
                    padding: "12px 28px",
                    background: bookingCreated ? "#e8e0d8" : !formReady ? "#ede8e2" : `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
                    color: bookingCreated || !formReady ? "#aaa" : "#fff",
                    border: "none", borderRadius: 8,
                    fontSize: 13, fontWeight: 700, letterSpacing: 0.8,
                    textTransform: "uppercase",
                    cursor: bookingCreated || !formReady ? "not-allowed" : "pointer",
                    boxShadow: bookingCreated || !formReady ? "none" : "0 4px 14px rgba(168,104,48,0.35)",
                    transition: "all 0.2s",
                  }}
                >
                  {bookingCreated ? t.createdBtn : t.createBtn}
                </button>
                <button
                  onClick={handleReset}
                  style={{
                    padding: "12px 20px",
                    background: "#fff", color: C.textMuted,
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
                >
                  {t.resetBtn}
                </button>
              </Box>
            </Box>

          </Box>
        </Box>

        {/* ══ RIGHT: Actions ══ */}
        <Box sx={{ background: C.card, borderRadius: 3, border: `1px solid ${C.border}`, p: 3, boxShadow: "0 2px 10px rgba(139,100,60,0.07)", display: "flex", flexDirection: "column", gap: 2 }}>
          <SectionHead>{t.actions}</SectionHead>

          <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
              <FieldLabel>{t.bookingNumber}</FieldLabel>
              <button
                onClick={() => { setSearchModal(true); setSearchResults([]); setSearchError(""); setSearchQuery({ mobile: "", name: "" }); }}
                style={{
                  background: "none", border: "none", padding: "2px 6px",
                  fontSize: 11, fontWeight: 600, color: C.accent,
                  cursor: "pointer", textDecoration: "underline",
                }}
              >
                {t.searchLink}
              </button>
            </Box>
            <input
              value={bookingNumber}
              onChange={(e) => setBookingNumber(sanitizers.booking(e.target.value.toUpperCase()))}
              placeholder="ROOM-2026-XXXXXXX"
              style={{ ...inputBase(false), fontFamily: "'Courier New', monospace", letterSpacing: 1.5, fontSize: 13 }}
              onFocus={(e) => { e.target.style.borderColor = C.borderFocus; }}
              onBlur={(e) => { e.target.style.borderColor = C.border; }}
            />
          </Box>

          {/* ── Booking Search Modal ── */}
          {searchModal && (
            <Box sx={{
              position: "fixed", inset: 0, zIndex: 1300,
              background: "rgba(45,31,15,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }} onClick={() => setSearchModal(false)}>
              <Box onClick={(e) => e.stopPropagation()} sx={{
                background: "#fff", borderRadius: 3, p: 3,
                width: { xs: "92vw", sm: 540 }, maxHeight: "80vh",
                overflow: "auto", boxShadow: "0 8px 40px rgba(45,31,15,0.25)",
                border: `1px solid ${C.border}`,
              }}>
                {/* Modal header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 3, height: 18, background: C.accent, borderRadius: 2 }} />
                    <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: C.accent }}>
                      {t.searchBooking}
                    </Typography>
                  </Box>
                  <button onClick={() => setSearchModal(false)} style={{
                    background: "none", border: "none", fontSize: 18,
                    cursor: "pointer", color: C.textMuted, lineHeight: 1,
                  }}>✕</button>
                </Box>

                {/* Search inputs */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                  <Field label={t.mobile} name="smobile" value={searchQuery.mobile}
                    onChange={(e) => setSearchQuery(q => ({ ...q, mobile: e.target.value.replace(/[^0-9]/g, "").slice(0, 10) }))}
                    placeholder="10 digits" />
                  <Field label={t.customerName} name="sname" value={searchQuery.name}
                    onChange={(e) => setSearchQuery(q => ({ ...q, name: e.target.value.slice(0, 60) }))}
                    placeholder="Full name" />
                </Box>

                {searchError && (
                  <Box sx={{ mb: 1.5, p: 1.5, background: "#fff5f5", border: "1px solid #e8c0c0", borderRadius: 2 }}>
                    <Typography sx={{ fontSize: 12, color: "#b03030" }}>{searchError}</Typography>
                  </Box>
                )}

                <button
                  onClick={handleBookingSearch}
                  disabled={searchLoading}
                  style={{
                    width: "100%", padding: "10px", marginBottom: 16,
                    background: searchLoading ? "#e8e0d8" : `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
                    color: searchLoading ? "#aaa" : "#fff",
                    border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
                    cursor: searchLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {searchLoading ? t.searching : t.searchBtn}
                </button>

                {/* Results */}
                {searchResults.length > 0 && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", mb: 0.5 }}>
                      {t.bookingsFound(searchResults.length)}
                    </Typography>
                    {searchResults.map((bk) => {
                      const statusColor = bk.status === "BOOKED" ? "#9a7020" : bk.status === "CHECKED_IN" ? "#2d7a2d" : bk.status === "CHECKED_OUT" ? "#888" : "#b03030";
                      const statusBg    = bk.status === "BOOKED" ? "#fffbf0" : bk.status === "CHECKED_IN" ? "#f0faf0" : "#f5f5f5";
                      const fmtDt = (v) => {
                        if (!v) return "";
                        if (Array.isArray(v)) {
                          const [yr, mo, d, h = 0, m = 0] = v;
                          return new Date(yr, mo - 1, d, h, m).toLocaleString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
                        }
                        return new Date(v).toLocaleString("en-IN");
                      };
                      return (
                        <Box key={bk.bookingNumber} sx={{
                          p: 1.5, borderRadius: 2,
                          border: `1px solid ${C.border}`,
                          background: "#fdf9f4",
                        }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <Box>
                              <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "monospace" }}>
                                {bk.bookingNumber}
                              </Typography>
                              <Typography sx={{ fontSize: 12, color: C.textMuted, mt: 0.3 }}>
                                {bk.customerName} · {bk.mobileNumber}
                              </Typography>
                              <Typography sx={{ fontSize: 11, color: C.textMuted }}>
                                Room {bk.roomNumber} · In: {fmtDt(bk.scheduledCheckIn)}
                              </Typography>
                              <Box sx={{ display: "inline-block", mt: 0.5, px: 1, py: 0.2, borderRadius: 1, background: statusBg }}>
                                <Typography sx={{ fontSize: 10, fontWeight: 700, color: statusColor }}>
                                  {bk.status}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, ml: 1.5, flexShrink: 0 }}>
                              {bk.status !== "CANCELLED" && (
                                <button
                                  onClick={() => handleSelectBooking(bk)}
                                  style={{
                                    padding: "6px 12px",
                                    background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
                                    color: "#fff", border: "none", borderRadius: 6,
                                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {t.selectBooking}
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  try {
                                    const pr = await printBookingReceipt(bk.bookingNumber);
                                    const url = URL.createObjectURL(new Blob([pr.data], { type: "application/pdf" }));
                                    const w = window.open(url, "_blank");
                                    if (w) w.addEventListener("load", () => { w.print(); setTimeout(() => URL.revokeObjectURL(url), 60000); });
                                  } catch { setError("Failed to print receipt"); }
                                }}
                                style={{
                                  padding: "6px 12px",
                                  background: "#fdf6ee",
                                  color: C.textMuted,
                                  border: `1px solid ${C.border}`,
                                  borderRadius: 6, fontSize: 11, fontWeight: 700,
                                  cursor: "pointer", whiteSpace: "nowrap",
                                }}
                              >
                                {t.printReceipt}
                              </button>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Box>
          )}

          <Divider sx={{ borderColor: "#f0e8dc" }} />

          <ActionBtn label={t.checkInBtn}  icon="🔑" onClick={handleCheckIn}
            disabled={bookingStatus !== "BOOKED"} colorSet="green" />
          <ActionBtn label={t.checkoutBtn}   icon="🚪" onClick={handleCheckout}
            disabled={bookingStatus !== "CHECKED_IN"} colorSet="red" />
          <ActionBtn label={t.shiftBtn} icon="🔄" onClick={handleShift}
            disabled={bookingStatus !== "BOOKED" && bookingStatus !== "CHECKED_IN"} colorSet="blue" />

          {/* Status indicator */}
          {bookingStatus && (
            <Box sx={{
              mt: 1, px: 2, py: 1, borderRadius: 2, textAlign: "center",
              background: bookingStatus === "BOOKED" ? "#fffbf0" : bookingStatus === "CHECKED_IN" ? "#f0faf0" : "#f5f5f5",
              border: `1px solid ${bookingStatus === "BOOKED" ? "#f0d080" : bookingStatus === "CHECKED_IN" ? "#b8ddb8" : "#e0e0e0"}`,
            }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 1,
                color: bookingStatus === "BOOKED" ? "#9a7020" : bookingStatus === "CHECKED_IN" ? "#2d7a2d" : "#888",
              }}>
                {bookingStatus === "BOOKED" ? t.statusBooked
                  : bookingStatus === "CHECKED_IN" ? t.statusCheckedIn
                  : t.statusCheckedOut}
              </Typography>
            </Box>
          )}
        </Box>

      </Box>

      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess("")}>
        <Alert severity="success">{success}</Alert>
      </Snackbar>
      {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")}>{error}</Alert>}

    </Box>
  );
}
