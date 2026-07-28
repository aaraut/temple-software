import { useEffect, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  Divider,
  Alert,
  Chip,
  CircularProgress,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";

import { createBooking, checkoutBooking, getBookingDetail, printBookingReceipt } from "../../api/roomBookingApi";
import { useAuth } from "../../context/AuthContext";
import { formatDateTime } from "../../utils/dateUtils";

const ID_PROOF_TYPES = ["AADHAR", "DRIVING_LICENSE", "GOVT_ID"];

const STATUS_COLOR = {
  CHECKED_IN: "warning", CHECKED_OUT: "success", ROOM_SHIFTED: "default", CANCELLED: "error",
};

function calcBaseAmount(room, numPersons) {
  if (!room) return 0;
  if (room.pricingType === "PERSON_COUNT") {
    const extra = Math.max(0, (numPersons || 0) - 2);
    return Number(room.baseRent24Hr || 0) + Number(room.extraPersonCost || 0) * extra;
  }
  return Number(room.baseRent24Hr || 0);
}

function InfoRow({ label, value }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.6, gap: 2 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right" }}>{value ?? "—"}</Typography>
    </Box>
  );
}

export default function SlotSidebar({ open, onClose, room, slot, onSuccess, readOnly = false }) {
  const { auth, language } = useAuth();

  const L = {
    en: {
      newBooking: "New Booking", guestName: "Guest Name", mobile: "Mobile Number",
      idProofType: "ID Proof Type", idProofNumber: "ID Proof Number", persons: "Number of Persons",
      extraAmount: "Extra Amount", deposit: "Security Deposit", price: "Tariff",
      bookAndCheckIn: "Book & Check In", checkoutTitle: "Checkout",
      penalty: "Penalty / Deduction", penaltyReason: "Reason for Penalty / Deduction",
      remarks: "Remarks", netPayable: "Net Cash to Collect", confirmCheckout: "Confirm Checkout",
      guest: "Guest", checkIn: "Check-in", checkOut: "Check-out", room: "Room", category: "Category",
      close: "Close", maxExceeded: "Exceeds this room's max occupancy", bookingNo: "Receipt No.",
      base: "Base Amount", print: "Print Receipt", notActionable: "This room/date isn't actionable right now — details only, no actions.",
    },
    hi: {
      newBooking: "नई बुकिंग", guestName: "अतिथि नाम", mobile: "मोबाइल नंबर",
      idProofType: "पहचान पत्र प्रकार", idProofNumber: "पहचान पत्र नंबर", persons: "व्यक्तियों की संख्या",
      extraAmount: "अतिरिक्त राशि", deposit: "सुरक्षा जमा", price: "किराया",
      bookAndCheckIn: "बुक करें और चेक-इन करें", checkoutTitle: "चेकआउट",
      penalty: "पेनल्टी / कटौती", penaltyReason: "पेनल्टी / कटौती का कारण",
      remarks: "टिप्पणी", netPayable: "कुल नकद प्राप्त करना है", confirmCheckout: "चेकआउट कन्फर्म करें",
      guest: "अतिथि", checkIn: "चेक-इन", checkOut: "चेक-आउट", room: "कमरा", category: "श्रेणी",
      close: "बंद करें", maxExceeded: "इस कमरे की अधिकतम क्षमता से अधिक", bookingNo: "रसीद क्रमांक",
      base: "मूल राशि", print: "रसीद प्रिंट करें", notActionable: "यह कमरा/तारीख अभी कार्रवाई योग्य नहीं है — केवल विवरण देखे जा सकते हैं।",
    },
  };
  const t = L[language] ?? L.en;

  const [form, setForm] = useState({
    customerName: "", mobileNumber: "", idProofType: "", idProofNumber: "",
    numPersons: 2, extraChargeAmount: 0, securityDeposit: 0,
  });
  const [checkoutForm, setCheckoutForm] = useState({
    extraChargeAmount: 0, deductionFromDeposit: 0, penaltyReason: "", remarks: "",
  });
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [printing, setPrinting] = useState(false);

  const isEmpty = slot && slot.status === "AVAILABLE" && !readOnly;
  const isCheckedIn = slot && slot.status === "CHECKED_IN" && !readOnly;
  const isReadOnly = slot && !isEmpty && !isCheckedIn;

  useEffect(() => {
    setError("");
    setDetail(null);
    if (!open || !slot) return;

    if (isEmpty) {
      setForm({
        customerName: "", mobileNumber: "", idProofType: "", idProofNumber: "",
        numPersons: 2, extraChargeAmount: 0, securityDeposit: 0,
      });
    } else if (slot.bookingNumber) {
      setLoadingDetail(true);
      getBookingDetail(slot.bookingNumber)
        .then((res) => {
          setDetail(res.data);
          setCheckoutForm({
            extraChargeAmount: res.data.extraChargeAmount || 0,
            deductionFromDeposit: 0,
            penaltyReason: "",
            remarks: "",
          });
        })
        .catch(() => setError("Failed to load booking detail"))
        .finally(() => setLoadingDetail(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, slot, readOnly]);

  if (!open || !slot || !room) return null;

  const baseAmount = calcBaseAmount(room, form.numPersons);
  const personsExceeded = room.maxOccupancy != null && form.numPersons > room.maxOccupancy;

  const handleBook = async () => {
    setError("");
    if (!form.customerName || !form.mobileNumber) {
      setError(language === "hi" ? "नाम और मोबाइल आवश्यक है" : "Name and mobile are required");
      return;
    }
    if (personsExceeded) {
      setError(t.maxExceeded);
      return;
    }
    setSubmitting(true);
    try {
      await createBooking({
        roomId: room.roomId,
        customerName: form.customerName,
        mobileNumber: form.mobileNumber,
        idProofType: form.idProofType || null,
        idProofNumber: form.idProofNumber || null,
        numPersons: Number(form.numPersons),
        extraChargeAmount: Number(form.extraChargeAmount) || 0,
        securityDeposit: Number(form.securityDeposit) || 0,
        createdBy: auth.username,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  const depositAmt = detail ? Number(detail.securityDeposit || 0) : 0;
  const netPayable = detail
    ? Number(detail.baseAmount || 0)
        + Number(checkoutForm.extraChargeAmount || 0)
        + Number(checkoutForm.deductionFromDeposit || 0)
        - depositAmt
    : 0;

  const handleCheckout = async () => {
    setError("");
    if (Number(checkoutForm.deductionFromDeposit) > 0 && !checkoutForm.penaltyReason.trim()) {
      setError(t.penaltyReason + " *");
      return;
    }
    setSubmitting(true);
    try {
      await checkoutBooking({
        bookingNumber: slot.bookingNumber,
        extraChargeAmount: Number(checkoutForm.extraChargeAmount) || 0,
        deductionFromDeposit: Number(checkoutForm.deductionFromDeposit) || 0,
        penaltyReason: checkoutForm.penaltyReason || null,
        remarks: checkoutForm.remarks,
        handledBy: auth.username,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data || "Checkout failed");
    } finally {
      setSubmitting(false);
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
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {t.room} {room.roomNumber} · {room.categoryName}
        </Typography>

        {error && <Alert severity="error" sx={{ my: 1 }}>{error}</Alert>}

        {isEmpty && (
          <>
            <Typography variant="h6" sx={{ mt: 1, mb: 2 }}>{t.newBooking}</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t.price}: ₹{baseAmount}
            </Typography>

            <TextField fullWidth sx={{ mb: 2 }} label={t.guestName + " *"}
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })} />

            <TextField fullWidth sx={{ mb: 2 }} label={t.mobile + " *"}
              value={form.mobileNumber}
              onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t.idProofType}</InputLabel>
              <Select label={t.idProofType} value={form.idProofType}
                onChange={(e) => setForm({ ...form, idProofType: e.target.value })}>
                <MenuItem value="">—</MenuItem>
                {ID_PROOF_TYPES.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField fullWidth sx={{ mb: 2 }} label={t.idProofNumber}
              value={form.idProofNumber}
              onChange={(e) => setForm({ ...form, idProofNumber: e.target.value })} />

            <TextField fullWidth sx={{ mb: 2 }} type="number" label={t.persons}
              value={form.numPersons}
              error={personsExceeded}
              helperText={personsExceeded ? t.maxExceeded : ""}
              onChange={(e) => setForm({ ...form, numPersons: Number(e.target.value) })} />

            <TextField fullWidth sx={{ mb: 2 }} type="number" label={t.extraAmount}
              value={form.extraChargeAmount}
              onChange={(e) => setForm({ ...form, extraChargeAmount: e.target.value })} />

            <TextField fullWidth sx={{ mb: 3 }} type="number" label={t.deposit}
              value={form.securityDeposit}
              onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })} />

            <Button fullWidth variant="contained" disabled={submitting} onClick={handleBook}>
              {t.bookAndCheckIn}
            </Button>
          </>
        )}

        {(isCheckedIn || isReadOnly) && (
          loadingDetail ? <CircularProgress sx={{ mt: 3 }} /> : detail && (
            <>
              {readOnly && slot.status === "CHECKED_IN" && (
                <Alert severity="info" sx={{ mb: 2 }}>{t.notActionable}</Alert>
              )}

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
                {detail.deductionFromDeposit > 0 && (
                  <InfoRow label={t.penalty} value={`₹${detail.deductionFromDeposit}`} />
                )}
                <InfoRow label={t.deposit} value={`₹${detail.securityDeposit ?? 0}`} />
                <Divider sx={{ my: 1 }} />
                <InfoRow label={t.netPayable} value={`₹${detail.netPayableAmount ?? 0}`} />
              </Box>

              <Button fullWidth variant="outlined" startIcon={<PrintIcon />} disabled={printing}
                onClick={handlePrint} sx={{ mb: 2 }}>
                {t.print}
              </Button>

              {isCheckedIn && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>{t.checkoutTitle}</Typography>

                  <TextField fullWidth sx={{ mb: 2 }} type="number" label={t.extraAmount}
                    value={checkoutForm.extraChargeAmount}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, extraChargeAmount: e.target.value })} />

                  <TextField fullWidth sx={{ mb: 2 }} type="number" label={t.penalty}
                    value={checkoutForm.deductionFromDeposit}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, deductionFromDeposit: e.target.value })} />

                  <TextField fullWidth sx={{ mb: 2 }} multiline rows={2}
                    label={Number(checkoutForm.deductionFromDeposit) > 0 ? t.penaltyReason + " *" : t.penaltyReason}
                    value={checkoutForm.penaltyReason}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, penaltyReason: e.target.value })} />

                  <TextField fullWidth sx={{ mb: 2 }} label={t.remarks}
                    value={checkoutForm.remarks}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, remarks: e.target.value })} />

                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    {t.netPayable}: ₹{netPayable}
                  </Typography>

                  <Button fullWidth variant="contained" color="error" disabled={submitting} onClick={handleCheckout}>
                    {t.confirmCheckout}
                  </Button>
                </>
              )}
            </>
          )
        )}

        <Button fullWidth sx={{ mt: 2 }} onClick={onClose}>{t.close}</Button>
      </Box>
    </Drawer>
  );
}
