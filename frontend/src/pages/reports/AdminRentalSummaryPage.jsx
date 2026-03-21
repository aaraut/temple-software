import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Typography, Box, Button, Stack, Card, CardContent,
  Grid, TextField, Divider
} from "@mui/material";
import { getAdminRentalSummary } from "../../api/rentalReportApi";

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

export default function AdminRentalSummaryPage() {
  const [data, setData]       = useState(null);
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [preset, setPreset]   = useState("month");
  const [filters, setFilters] = useState(thisMonth());

  const applyPreset = (key) => {
    setPreset(key);
    if (key === "today") setFilters(today());
    else if (key === "week") setFilters(thisWeek());
    else setFilters(thisMonth());
  };

  useEffect(() => {
    setLoading(true);
    getAdminRentalSummary(filters)
      .then((r) => {
        const d = r.data;
        setData(d);
        setRows(
          (d.userBreakdown ?? []).map((x, i) => ({
            id: i,
            ...x,
            discountPercent:
              x.calculatedAmount > 0
                ? ((x.discountAmount / x.calculatedAmount) * 100).toFixed(1) + "%"
                : "0%"
          }))
        );
      })
      .catch(() => { setData(null); setRows([]); })
      .finally(() => setLoading(false));
  }, [filters]);

  const rupee = (v) => `₹ ${Number(v ?? 0).toLocaleString("hi-IN")}`;

  const columns = [
    { field: "createdBy",      headerName: "यूज़र",       flex: 1, minWidth: 110 },
    { field: "totalRentals",   headerName: "किराये",      width: 90,  align: "center", headerAlign: "center" },
    {
      field: "chargedAmount",  headerName: "आय (₹)",      flex: 1, minWidth: 110,
      align: "right", headerAlign: "right",
      renderCell: (p) => rupee(p.value)
    },
    {
      field: "calculatedAmount", headerName: "देय (₹)",   flex: 1, minWidth: 110,
      align: "right", headerAlign: "right",
      renderCell: (p) => rupee(p.value)
    },
    {
      field: "discountAmount", headerName: "छूट (₹)",     flex: 1, minWidth: 100,
      align: "right", headerAlign: "right",
      renderCell: (p) => rupee(p.value)
    },
    { field: "discountPercent", headerName: "छूट %",      width: 80,  align: "right", headerAlign: "right" },
    {
      field: "fineCollected",  headerName: "जुर्माना (₹)", flex: 1, minWidth: 110,
      align: "right", headerAlign: "right",
      renderCell: (p) => rupee(p.value)
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        किराया आय — एडमिन सारांश
      </Typography>

      {/* Filter bar */}
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", mb: 3 }}>
        <Stack direction="row" spacing={1}>
          {[["today","आज"],["week","इस सप्ताह"],["month","इस माह"]].map(([key, label]) => (
            <Button key={key} size="small"
              variant={preset === key ? "contained" : "outlined"}
              onClick={() => applyPreset(key)}
            >{label}</Button>
          ))}
        </Stack>
        <TextField size="small" label="से" type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.fromDate || ""}
          onChange={(e) => { setPreset(""); setFilters(f => ({ ...f, fromDate: e.target.value })); }}
        />
        <TextField size="small" label="तक" type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.toDate || ""}
          onChange={(e) => { setPreset(""); setFilters(f => ({ ...f, toDate: e.target.value })); }}
        />
      </Box>

      {/* Overall summary cards */}
      {data && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={3}>
              <StatCard label="कुल आय" value={rupee(data.totalChargedAmount)} color="success.main" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard label="कुल देय" value={rupee(data.totalCalculatedAmount)}
                sub={`छूट: ${rupee(data.totalDiscountAmount)}`} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard label="कुल जुर्माना" value={rupee(data.totalFineCollected)} color="warning.main" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard label="बाकी जमानत" value={rupee(data.depositPending)}
                color={Number(data.depositPending ?? 0) > 0 ? "error.main" : "text.primary"}
                sub={`जमा: ${rupee(data.depositCollected)} · वापस: ${rupee(data.depositRefunded)}`} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Per-user breakdown */}
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            यूज़र-वार विवरण
          </Typography>
        </>
      )}

      <Box sx={{ height: 420 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          sx={{ "& .MuiDataGrid-row:hover": { bgcolor: "action.hover" } }}
        />
      </Box>
    </Box>
  );
}
