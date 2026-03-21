import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Typography, Box, Button, Stack, Chip, TextField, MenuItem
} from "@mui/material";
import { getPendingRentals } from "../../api/rentalReportApi";

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

const fmtDate = (raw) => {
  if (!raw) return "";
  const d = new Date(raw);
  return isNaN(d) ? raw : d.toLocaleDateString("hi-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const STATUS_COLOR = { ISSUED: "warning", PARTIALLY_RETURNED: "info" };
const STATUS_LABEL = { ISSUED: "जारी", PARTIALLY_RETURNED: "आंशिक वापसी" };

export default function PendingRentalReportPage() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [preset, setPreset]   = useState("month");
  const [category, setCategory] = useState("");
  const [filters, setFilters] = useState(thisMonth());

  const applyPreset = (key) => {
    setPreset(key);
    if (key === "today") setFilters(today());
    else if (key === "week") setFilters(thisWeek());
    else setFilters(thisMonth());
  };

  useEffect(() => {
    setLoading(true);
    // No createdBy — fetch ALL users' pending rentals
    getPendingRentals({ ...filters, category })
      .then((r) => setRows(r.data.map((x, i) => ({ id: i, ...x }))))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [filters, category]);

  const columns = [
    { field: "receiptNumber", headerName: "रसीद", flex: 1.2, minWidth: 160 },
    {
      field: "createdAt", headerName: "दिनांक", flex: 1, minWidth: 110,
      renderCell: (p) => fmtDate(p.value)
    },
    {
      field: "category", headerName: "श्रेणी", width: 100,
      renderCell: (p) => (
        <Chip label={p.value === "BARTAN" ? "बर्तन" : "बिछायत"} size="small"
          color={p.value === "BARTAN" ? "primary" : "secondary"} variant="outlined" />
      )
    },
    { field: "customerName", headerName: "ग्राहक", flex: 1, minWidth: 120 },
    { field: "mobile",       headerName: "मोबाइल", flex: 1, minWidth: 110 },
    { field: "createdBy",    headerName: "यूज़र",   width: 100 },
    {
      field: "totalPendingQty", headerName: "बाकी सामान", width: 100,
      align: "center", headerAlign: "center",
      renderCell: (p) => (
        <Chip label={p.value} size="small"
          color={p.value > 0 ? "error" : "success"} />
      )
    },
    {
      field: "depositAmount", headerName: "जमानत (₹)", width: 110,
      align: "right", headerAlign: "right",
      renderCell: (p) => `₹ ${p.value ?? 0}`
    },
    {
      field: "status", headerName: "स्थिति", width: 130,
      renderCell: (p) => (
        <Chip
          label={STATUS_LABEL[p.value] ?? p.value}
          color={STATUS_COLOR[p.value] ?? "default"}
          size="small"
        />
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>लंबित किराये</Typography>
      </Box>

      {/* Filter bar */}
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", mb: 2 }}>
        <Stack direction="row" spacing={1}>
          {[["today","आज"],["week","इस सप्ताह"],["month","इस माह"]].map(([key, label]) => (
            <Button key={key} size="small"
              variant={preset === key ? "contained" : "outlined"}
              onClick={() => applyPreset(key)}
            >{label}</Button>
          ))}
        </Stack>

        <TextField
          select size="small" label="श्रेणी"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="">सभी</MenuItem>
          <MenuItem value="BARTAN">बर्तन</MenuItem>
          <MenuItem value="BICHAYAT">बिछायत</MenuItem>
        </TextField>

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

      {/* Grid */}
      <Box sx={{ height: 540 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          sx={{ "& .MuiDataGrid-row:hover": { bgcolor: "action.hover" } }}
        />
      </Box>
    </Box>
  );
}
