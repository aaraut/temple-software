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

export default function BookingTab() {
  const { auth } = useAuth();

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

  /* ---------------- CHECK-IN ---------------- */
  const handleCheckIn = async (bookingNumber) => {
    await checkInBooking({
      bookingNumber,
      handledBy: auth.username,
    });
    handleSearch();
  };

  /* ---------------- CHECKOUT ---------------- */
  const openCheckout = (booking) => {
    setSelectedBooking(booking);
    setCheckoutOpen(true);
  };

  const handleCheckout = async () => {
    await checkoutBooking({
      bookingNumber: selectedBooking.bookingNumber,
      extraChargeAmount: 0,
      deductionFromDeposit: deduction,
      remarks: "Checkout completed",
      handledBy: auth.username,
    });

    setCheckoutOpen(false);
    setDeduction(0);
    handleSearch();
  };

  /* ---------------- CANCEL ---------------- */
  const openCancel = (booking) => {
    setSelectedBooking(booking);
    setCancelOpen(true);
  };

  const handleCancel = async () => {
    await cancelBooking({
      bookingNumber: selectedBooking.bookingNumber,
      cancellationCharge,
      remarks: "Cancelled by counter",
      handledBy: auth.username,
    });

    setCancelOpen(false);
    setCancellationCharge(0);
    handleSearch();
  };

  /* ---------------- SHIFT ---------------- */
  const openShift = (booking) => {
    setSelectedBooking(booking);
    setShiftOpen(true);
  };

  const handleShift = async () => {
    await shiftRoom({
      oldBookingNumber: selectedBooking.bookingNumber,
      newRoomId,
      newScheduledCheckIn: selectedBooking.scheduledCheckIn,
      newScheduledCheckOut: selectedBooking.scheduledCheckOut,
      handledBy: auth.username,
    });

    setShiftOpen(false);
    setNewRoomId("");
    handleSearch();
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Booking Management
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="Search by Mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
        </Grid>
        <Grid item>
          <Button variant="contained" onClick={handleSearch}>
            Search
          </Button>
        </Grid>
      </Grid>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Booking</TableCell>
            <TableCell>Room</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {results.map((r) => (
            <TableRow key={r.bookingNumber}>
              <TableCell>{r.bookingNumber}</TableCell>
              <TableCell>{r.roomNumber}</TableCell>
              <TableCell>
                <Chip
                  label={r.status}
                  color={statusColor[r.status]}
                  size="small"
                />
              </TableCell>
              <TableCell>₹ {r.grossAmount}</TableCell>

              <TableCell>
                {r.status === "BOOKED" && (
                  <>
                    <Button size="small" onClick={() => handleCheckIn(r.bookingNumber)}>
                      Check-In
                    </Button>

                    <Button
                      size="small"
                      color="warning"
                      onClick={() => openCancel(r)}
                    >
                      Cancel
                    </Button>

                    <Button
                      size="small"
                      color="secondary"
                      onClick={() => openShift(r)}
                    >
                      Shift
                    </Button>
                  </>
                )}

                {r.status === "CHECKED_IN" && (
                  <>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => openCheckout(r)}
                    >
                      Checkout
                    </Button>

                    <Button
                      size="small"
                      color="secondary"
                      onClick={() => openShift(r)}
                    >
                      Shift
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* CHECKOUT DIALOG */}
      <Dialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)}>
        <DialogTitle>Checkout</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Deduction From Deposit"
            value={deduction}
            onChange={(e) => setDeduction(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCheckout}>
            Confirm Checkout
          </Button>
        </DialogActions>
      </Dialog>

      {/* CANCEL DIALOG */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)}>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Cancellation Charge"
            value={cancellationCharge}
            onChange={(e) => setCancellationCharge(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)}>Back</Button>
          <Button variant="contained" color="warning" onClick={handleCancel}>
            Confirm Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* SHIFT DIALOG */}
      <Dialog open={shiftOpen} onClose={() => setShiftOpen(false)}>
        <DialogTitle>Shift Room</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="New Room ID"
            value={newRoomId}
            onChange={(e) => setNewRoomId(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShiftOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleShift}>
            Confirm Shift
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}