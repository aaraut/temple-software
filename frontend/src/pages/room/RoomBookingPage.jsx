import { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Grid,
  Paper,
  Typography,
  Snackbar,
  Alert,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Divider,
} from "@mui/material";

import {
  createBooking,
  checkInBooking,
  checkoutBooking,
  shiftRoom,
  getAvailability,
  searchBookings,
} from "../../api/roomBookingApi";

import { getRooms } from "../../api/roomApi";
import { useAuth } from "../../context/AuthContext";

export default function RoomBookingPage() {
  const { auth } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [bookingNumber, setBookingNumber] = useState("");

  const [availability, setAvailability] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const [form, setForm] = useState({
    roomId: "",
    customerName: "",
    mobileNumber: "",
    idProofType: "AADHAR",
    idProofNumber: "",
    bookingType: "TWENTY_FOUR_HOUR",
    scheduledCheckIn: "",
    scheduledCheckOut: "",
    extraSurchargeAmount: 0,
    extraChargeAmount: 0,
    securityDeposit: 0,
  });

  const [grossAmount, setGrossAmount] = useState(0);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await getRooms();
      setRooms(data);
    } catch {
      setError("Failed to load rooms");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const selectedRoom = rooms.find((r) => r.id === Number(form.roomId));

  // -------- Calculate Gross --------
  useEffect(() => {
    if (!selectedRoom) return;

    let base = 0;

    switch (form.bookingType) {
      case "TWENTY_FOUR_HOUR":
        base = selectedRoom.baseRent24Hr || 0;
        break;
      case "FIXED_SLOT":
        base = selectedRoom.baseRentFixed || 0;
        break;
      case "THREE_HOUR":
        base = selectedRoom.baseRent3Hr || 0;
        break;
      case "SIX_HOUR":
        base = selectedRoom.baseRent6Hr || 0;
        break;
      default:
        base = 0;
    }

    const total =
      Number(base) +
      Number(form.extraSurchargeAmount || 0) +
      Number(form.extraChargeAmount || 0);

    setGrossAmount(total);
  }, [form, selectedRoom]);

  // ---------------- CREATE ----------------
  const handleCreate = async () => {
    try {
      const res = await createBooking({
        ...form,
        createdBy: auth.username,
      });

      setBookingNumber(res.data);
      setSuccess("Booking created: " + res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Create failed");
    }
  };

  // ---------------- CHECK-IN ----------------
  const handleCheckIn = async () => {
    try {
      await checkInBooking({
        bookingNumber,
        handledBy: auth.username,
      });
      setSuccess("Checked-in successfully");
    } catch (e) {
      setError(e.response?.data?.message || "Check-in failed");
    }
  };

  // ---------------- CHECKOUT ----------------
  const handleCheckout = async () => {
    try {
      await checkoutBooking({
        bookingNumber,
        extraChargeAmount: form.extraChargeAmount,
        deductionFromDeposit: 0,
        remarks: "Normal checkout",
        handledBy: auth.username,
      });
      setSuccess("Checked-out successfully");
    } catch (e) {
      setError(e.response?.data?.message || "Checkout failed");
    }
  };

  // ---------------- SHIFT ----------------
  const handleShift = async () => {
    try {
      const res = await shiftRoom({
        oldBookingNumber: bookingNumber,
        newRoomId: form.roomId,
        newScheduledCheckIn: form.scheduledCheckIn,
        newScheduledCheckOut: form.scheduledCheckOut,
        extraChargeAmount: form.extraChargeAmount,
        deductionFromDeposit: 0,
        handledBy: auth.username,
      });
      setBookingNumber(res.data);
      setSuccess("Shifted to: " + res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Shift failed");
    }
  };

  // ---------------- AVAILABILITY ----------------
  const handleAvailability = async () => {
    try {
      const res = await getAvailability(
        form.scheduledCheckIn,
        form.scheduledCheckOut
      );
      setAvailability(res.data);
    } catch {
      setError("Availability failed");
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: "auto", p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Bhakt Niwas – Room Booking
      </Typography>

      {/* ---------------- BOOKING FORM ---------------- */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6">Create Booking</Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={4}>
            <FormControl fullWidth>
              <InputLabel>Room</InputLabel>
              <Select
                name="roomId"
                value={form.roomId}
                label="Room"
                onChange={handleChange}
              >
                {rooms.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.roomNumber} - {r.blockName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Customer Name"
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Mobile Number"
              name="mobileNumber"
              value={form.mobileNumber}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={4}>
            <FormControl fullWidth>
              <InputLabel>ID Proof Type</InputLabel>
              <Select
                name="idProofType"
                value={form.idProofType}
                label="ID Proof Type"
                onChange={handleChange}
              >
                <MenuItem value="AADHAR">AADHAR</MenuItem>
                <MenuItem value="DRIVING_LICENSE">
                  DRIVING LICENSE
                </MenuItem>
                <MenuItem value="GOVT_ID">GOVT ID</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={4}>
            <TextField
              fullWidth
              label="ID Proof Number"
              name="idProofNumber"
              value={form.idProofNumber}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={4}>
            <FormControl fullWidth>
              <InputLabel>Booking Type</InputLabel>
              <Select
                name="bookingType"
                value={form.bookingType}
                label="Booking Type"
                onChange={handleChange}
              >
                <MenuItem value="TWENTY_FOUR_HOUR">24 Hour</MenuItem>
                <MenuItem value="FIXED_SLOT">Fixed Slot</MenuItem>
                <MenuItem value="THREE_HOUR">3 Hour</MenuItem>
                <MenuItem value="SIX_HOUR">6 Hour</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6}>
            <TextField
              type="datetime-local"
              fullWidth
              label="Check-In"
              name="scheduledCheckIn"
              InputLabelProps={{ shrink: true }}
              value={form.scheduledCheckIn}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              type="datetime-local"
              fullWidth
              label="Check-Out"
              name="scheduledCheckOut"
              InputLabelProps={{ shrink: true }}
              value={form.scheduledCheckOut}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              fullWidth
              type="number"
              label="Extra Surcharge"
              name="extraSurchargeAmount"
              value={form.extraSurchargeAmount}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              fullWidth
              type="number"
              label="Extra Charge"
              name="extraChargeAmount"
              value={form.extraChargeAmount}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              fullWidth
              type="number"
              label="Security Deposit"
              name="securityDeposit"
              value={form.securityDeposit}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1">
              Gross Amount: ₹ {grossAmount}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Button variant="contained" onClick={handleCreate}>
              Create Booking
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ---------------- ACTIONS ---------------- */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Actions</Typography>
        <Divider sx={{ mb: 2 }} />

        <TextField
          fullWidth
          label="Booking Number"
          value={bookingNumber}
          onChange={(e) => setBookingNumber(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Grid container spacing={2}>
          <Grid item>
            <Button variant="contained" onClick={handleCheckIn}>
              Check-In
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" color="error" onClick={handleCheckout}>
              Checkout
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" color="secondary" onClick={handleShift}>
              Shift Room
            </Button>
          </Grid>
          <Grid item>
            <Button variant="outlined" onClick={handleAvailability}>
              Availability
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess("")}
      >
        <Alert severity="success">{success}</Alert>
      </Snackbar>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}