import { useState } from "react";
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Box,
} from "@mui/material";
import { getRevenueReport } from "../../api/roomBookingApi";
import { useAuth } from "../../context/AuthContext";

const L = {
  en: {
    title: "Revenue & Cashbox Report",
    range: "Range",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    custom: "Custom",
    start: "Start",
    end: "End",
    username: "Username",
    generate: "Generate",
    totalRent: "Total Rent",
    depositCollected: "Deposit Collected",
    depositDeducted: "Deposit Deducted",
    netCash: "Net Cash in Box",
  },
  hi: {
    title: "राजस्व और कैशबॉक्स रिपोर्ट",
    range: "अवधि",
    daily: "दैनिक",
    weekly: "साप्ताहिक",
    monthly: "मासिक",
    custom: "कस्टम",
    start: "शुरुआत",
    end: "अंत",
    username: "उपयोगकर्ता नाम",
    generate: "रिपोर्ट बनाएं",
    totalRent: "कुल किराया",
    depositCollected: "जमा राशि",
    depositDeducted: "काटी गई जमा",
    netCash: "कुल नकद",
  },
};

export default function ReportsTab({ language = "hi" }) {
  const { auth } = useAuth();
  const t = L[language] ?? L.en;

  const [range, setRange] = useState("DAILY");
  const [data, setData] = useState(null);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [username, setUsername] = useState("");

  const calculateRange = () => {
    const now = new Date();
    let start = new Date();
    if (range === "DAILY") {
      start.setHours(0, 0, 0, 0);
    } else if (range === "WEEKLY") {
      start.setDate(now.getDate() - 7);
    } else if (range === "MONTHLY") {
      start.setMonth(now.getMonth() - 1);
    }
    return { start, end: now };
  };

  const handleGenerate = async () => {
    let start, end;
    if (range === "CUSTOM") {
      start = new Date(customStart);
      end = new Date(customEnd);
    } else {
      const r = calculateRange();
      start = r.start; end = r.end;
    }
    const selectedUser = auth.role === "ADMIN" ? username : auth.username;
    try {
      const res = await getRevenueReport(selectedUser, start.toISOString().slice(0,19), end.toISOString().slice(0,19));
      setData(res.data);
    } catch (err) {
      console.error("Revenue fetch failed");
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">{t.title}</Typography>
      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={3}>
          <FormControl fullWidth>
            <InputLabel>{t.range}</InputLabel>
            <Select value={range} label={t.range} onChange={(e) => setRange(e.target.value)}>
              <MenuItem value="DAILY">{t.daily}</MenuItem>
              <MenuItem value="WEEKLY">{t.weekly}</MenuItem>
              <MenuItem value="MONTHLY">{t.monthly}</MenuItem>
              <MenuItem value="CUSTOM">{t.custom}</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {range === "CUSTOM" && (
          <>
            <Grid item xs={3}>
              <TextField type="datetime-local" fullWidth label={t.start} InputLabelProps={{ shrink: true }} value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            </Grid>
            <Grid item xs={3}>
              <TextField type="datetime-local" fullWidth label={t.end} InputLabelProps={{ shrink: true }} value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            </Grid>
          </>
        )}

        {auth.role === "ADMIN" && (
          <Grid item xs={3}>
            <TextField fullWidth label={t.username} value={username} onChange={(e) => setUsername(e.target.value)} />
          </Grid>
        )}

        <Grid item>
          <Button variant="contained" onClick={handleGenerate}>{t.generate}</Button>
        </Grid>
      </Grid>

      {data && (
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={3}>
              <Typography>{t.totalRent}</Typography>
              <Typography variant="h6">₹ {data.totalRent}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography>{t.depositCollected}</Typography>
              <Typography variant="h6">₹ {data.totalDepositCollected}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography>{t.depositDeducted}</Typography>
              <Typography variant="h6">₹ {data.totalDepositRefunded}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography>{t.netCash}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }} color="success.main">₹ {data.netCash}</Typography>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
}
