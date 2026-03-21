import { useState } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
} from "@mui/material";

import {
  searchBookings,
  shiftRoom,
  checkInBooking,
  checkoutBooking,
  cancelBooking,
} from "../../api/roomBookingApi";

import { useAuth } from "../../context/AuthContext";

const statusColor = {
  BOOKED: "info",
  CHECKED_IN: "success",
  CHECKED_OUT: "default",
  ROOM_SHIFTED: "warning",
  CANCELLED: "error",
};

const L = {
  en: {
    title: "Booking Management",
    searchByMobile: "Search by Mobile",
    search: "Search",
    booking: "Booking",
    room: "Room",
    status: "Status",
    amount: "Amount",
    actions: "Actions",
    checkIn: "Check-In",
    cancel: "Cancel",
    shift: "Shift",
    checkout: "Checkout",
    checkoutTitle: "Checkout",
    deduction: "Deduction From Deposit",
    cancelTitle: "Cancel Booking",
    cancellationCharge: "Cancellation Charge",
    shiftTitle: "Shift Room",
    newRoomId: "New Room ID",
    back: "Back",
    confirm: "Confirm Checkout",
    confirmCancel: "Confirm Cancel",
    confirmShift: "Confirm Shift",
  },
  hi: {
    title: "बुकिंग प्रबंधन",
    searchByMobile: "मोबाइल से खोजें",
    search: "खोजें",
    booking: "बुकिंग",
    room: "कमरा",
    status: "स्थिति",
    amount: "राशि",
    actions: "कार्य",
    checkIn: "चेक-इन",
    cancel: "रद्द करें",
    shift: "शिफ्ट",
    checkout: "चेकआउट",
    checkoutTitle: "चेकआउट",
    deduction: "जमा से कटौती",
    cancelTitle: "बुकिंग रद्द करें",
    cancellationCharge: "रद्दीकरण शुल्क",
    shiftTitle: "कमरा बदलें",
    newRoomId: "नया कमरा आईडी",
    back: "वापस",
    confirm: "चेकआउट पुष्टि करें",
    confirmCancel: "रद्दीकरण पुष्टि करें",
    confirmShift: "शिफ्ट पुष्टि करें",
  },
};

export default function BookingTab({ language = "hi" }) {
  const { auth } = useAuth();
  const t = L[language] ?? L.en;

  const [mobile, setMobile] = useState("");
  const [results, setResults] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [newRoomId, setNewRoomId] = useState("");
  const [deduction, setDeduction] = useState(0);
  const [cancellationCharge, setCancellationCharge] = useState(0);

  const handleSearch = async () => {
    const res = await searchBookings({ mobileNumber: mobile });
    setResults(res.data);
  };

  const handleCheckIn = async (bookingNumber) => {
    await checkInBooking({ bookingNumber, handledBy: auth.username });
    handleSearch();
  };

  const openCheckout = (booking) => { setSelectedBooking(booking); setCheckoutOpen(true); };
  const handleCheckout = async () => {
    await checkoutBooking({
      bookingNumber: selectedBooking.bookingNumber,
      extraChargeAmount: 0,
      deductionFromDeposit: deduction,
      remarks: "Checkout completed",
      handledBy: auth.username,
    });
    setCheckoutOpen(false); setDeduction(0); handleSearch();
  };

  const openCancel = (booking) => { setSelectedBooking(booking); setCancelOpen(true); };
  const handleCancel = async () => {
    await cancelBooking({
      bookingNumber: selectedBooking.bookingNumber,
      cancellationCharge,
      remarks: "Cancelled by counter",
      handledBy: auth.username,
    });
    setCancelOpen(false); setCancellationCharge(0); handleSearch();
  };

  const openShift = (booking) => { setSelectedBooking(booking); setShiftOpen(true); };
  const handleShift = async () => {
    await shiftRoom({
      oldBookingNumber: selectedBooking.bookingNumber,
      newRoomId,
      newScheduledCheckIn: selectedBooking.scheduledCheckIn,
      newScheduledCheckOut: selectedBooking.scheduledCheckOut,
      handledBy: auth.username,
    });
    setShiftOpen(false); setNewRoomId(""); handleSearch();
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>{t.title}</Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <TextField fullWidth label={t.searchByMobile} value={mobile} onChange={(e) => setMobile(e.target.value)} />
        </Grid>
        <Grid item>
          <Button variant="contained" onClick={handleSearch}>{t.search}</Button>
        </Grid>
      </Grid>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t.booking}</TableCell>
            <TableCell>{t.room}</TableCell>
            <TableCell>{t.status}</TableCell>
            <TableCell>{t.amount}</TableCell>
            <TableCell>{t.actions}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((r) => (
            <TableRow key={r.bookingNumber}>
              <TableCell>{r.bookingNumber}</TableCell>
              <TableCell>{r.roomNumber}</TableCell>
              <TableCell>
                <Chip label={r.status} color={statusColor[r.status]} size="small" />
              </TableCell>
              <TableCell>₹ {r.grossAmount}</TableCell>
              <TableCell>
                {r.status === "BOOKED" && (
                  <>
                    <Button size="small" onClick={() => handleCheckIn(r.bookingNumber)}>{t.checkIn}</Button>
                    <Button size="small" color="warning" onClick={() => openCancel(r)}>{t.cancel}</Button>
                    <Button size="small" color="secondary" onClick={() => openShift(r)}>{t.shift}</Button>
                  </>
                )}
                {r.status === "CHECKED_IN" && (
                  <>
                    <Button size="small" color="error" onClick={() => openCheckout(r)}>{t.checkout}</Button>
                    <Button size="small" color="secondary" onClick={() => openShift(r)}>{t.shift}</Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* CHECKOUT DIALOG */}
      <Dialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)}>
        <DialogTitle>{t.checkoutTitle}</DialogTitle>
        <DialogContent>
          <TextField fullWidth type="number" label={t.deduction} value={deduction} onChange={(e) => setDeduction(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutOpen(false)}>{t.back}</Button>
          <Button variant="contained" onClick={handleCheckout}>{t.confirm}</Button>
        </DialogActions>
      </Dialog>

      {/* CANCEL DIALOG */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)}>
        <DialogTitle>{t.cancelTitle}</DialogTitle>
        <DialogContent>
          <TextField fullWidth type="number" label={t.cancellationCharge} value={cancellationCharge} onChange={(e) => setCancellationCharge(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)}>{t.back}</Button>
          <Button variant="contained" color="warning" onClick={handleCancel}>{t.confirmCancel}</Button>
        </DialogActions>
      </Dialog>

      {/* SHIFT DIALOG */}
      <Dialog open={shiftOpen} onClose={() => setShiftOpen(false)}>
        <DialogTitle>{t.shiftTitle}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label={t.newRoomId} value={newRoomId} onChange={(e) => setNewRoomId(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShiftOpen(false)}>{t.back}</Button>
          <Button variant="contained" onClick={handleShift}>{t.confirmShift}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
