import { useEffect, useState } from "react";
import {
  Box, Typography, Card, CardContent, Grid,
  Button, Stack, TextField, Divider
} from "@mui/material";
import { getMyRentalSummary } from "../../api/rentalReportApi";
import { useAuth } from "../../context/AuthContext";

const fmt = (d) => d.toISOString().slice(0, 10);
const today     = () => { const d = new Date(); return { fromDate: fmt(d), toDate: fmt(d) }; };
const thisWeek  = () => {
  const now = new Date(), day = now.getDay();
  const mon = new Date(now); mon.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { fromDate: fmt(mon), toDate: fmt(sun) };
};
const thisMonth = () => {
  const now = new Date();
  return {
    fromDate: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
    toDate:   fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  };
};

const L = {
  hi: {
    title: "मेरी किराया रिपोर्ट",
    today: "आज", week: "इस सप्ताह", month: "इस माह",
    from: "से", to: "तक",
    totalRentals: "कुल किराये",
    totalIncome: "कुल आय",
    deposit: "जमानत राशि",
    discount: "कुल छूट",
    totalDue: "कुल देय",
    depositSection: "जमानत विवरण",
    depositCollected: "जमा की गई",
    depositRefunded: "वापस की गई",
    depositPending: "बाकी जमानत",
    loading: "डेटा लोड हो रहा है...",
  },
  en: {
    title: "My Rental Report",
    today: "Today", week: "This Week", month: "This Month",
    from: "From", to: "To",
    totalRentals: "Total Rentals",
    totalIncome: "Total Income",
    deposit: "Security Deposit",
    discount: "Total Discount",
    totalDue: "Total Due",
    depositSection: "Deposit Breakdown",
    depositCollected: "Collected",
    depositRefunded: "Refunded",
    depositPending: "Pending Deposit",
    loading: "Loading data...",
  },
};

function StatCard({ label, value, color = "text.primary", sub }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={700} color={color}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary">{sub}</Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function MyRentalSummaryPage() {
  const { auth, language } = useAuth();
  const t = L[language] ?? L.en;

  const [data, setData]     = useState(null);
  const [preset, setPreset] = useState("month");
  const [filters, setFilters] = useState(thisMonth());

  const applyPreset = (key) => {
    setPreset(key);
    if (key === "today") setFilters(today());
    else if (key === "week") setFilters(thisWeek());
    else setFilters(thisMonth());
  };

  useEffect(() => {
    getMyRentalSummary({ createdBy: auth.username, ...filters })
      .then((r) => setData(r.data))
      .catch(() => setData(null));
  }, [filters]);

  const rupee = (v) => `₹ ${Number(v ?? 0).toLocaleString("en-IN")}`;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        {t.title}
      </Typography>

      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", mb: 3 }}>
        <Stack direction="row" spacing={1}>
          {[["today", t.today], ["week", t.week], ["month", t.month]].map(([key, label]) => (
            <Button key={key} size="small"
              variant={preset === key ? "contained" : "outlined"}
              onClick={() => applyPreset(key)}
            >{label}</Button>
          ))}
        </Stack>
        <TextField size="small" label={t.from} type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.fromDate || ""}
          onChange={(e) => { setPreset(""); setFilters(f => ({ ...f, fromDate: e.target.value })); }}
        />
        <TextField size="small" label={t.to} type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.toDate || ""}
          onChange={(e) => { setPreset(""); setFilters(f => ({ ...f, toDate: e.target.value })); }}
        />
      </Box>

      {data ? (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={3}>
              <StatCard label={t.totalRentals} value={data.totalRentals ?? "—"} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard label={t.totalIncome} value={rupee(data.totalChargedAmount)} color="success.main" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard label={t.deposit} value={rupee(data.depositCollected)} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard label={t.discount} value={rupee(data.totalDiscountAmount)} color="error.main"
                sub={data.totalCalculatedAmount ? `${t.totalDue}: ${rupee(data.totalCalculatedAmount)}` : undefined}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t.depositSection}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4}>
              <StatCard label={t.depositCollected} value={rupee(data.depositCollected)} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <StatCard label={t.depositRefunded} value={rupee(data.depositRefunded)} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <StatCard label={t.depositPending} value={rupee(data.depositPending)}
                color={Number(data.depositPending ?? 0) > 0 ? "warning.main" : "text.primary"} />
            </Grid>
          </Grid>
        </>
      ) : (
        <Typography color="text.secondary">{t.loading}</Typography>
      )}
    </Box>
  );
}
