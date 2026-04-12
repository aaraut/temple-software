import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Typography, Box, Button, Stack, Chip, TextField, MenuItem
} from "@mui/material";
import { getMyRentalEntries } from "../../api/rentalReportApi";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const fmt = (d) => d.toISOString().slice(0, 10);
const today      = () => { const d = new Date(); return { fromDate: fmt(d), toDate: fmt(d) }; };
const thisWeek   = () => {
  const now = new Date(), day = now.getDay();
  const mon = new Date(now); mon.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { fromDate: fmt(mon), toDate: fmt(sun) };
};
const thisMonth  = () => {
  const now = new Date();
  return {
    fromDate: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
    toDate:   fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  };
};

const fmtDate = (raw) => {
  if (!raw) return "";
  const d = new Date(raw);
  return isNaN(d) ? raw : d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const STATUS_COLOR = { ISSUED: "warning", PARTIALLY_RETURNED: "info", CLOSED: "success", RETURNED: "success" };

const L = {
  hi: {
    title: "किराया प्रविष्टियाँ",
    today: "आज", week: "इस सप्ताह", month: "इस माह",
    categoryLabel: "श्रेणी", all: "सभी", bartan: "बर्तन", bichayat: "बिछायत",
    from: "से", to: "तक",
    colReceipt: "रसीद", colDate: "दिनांक", colCategory: "श्रेणी",
    colCustomer: "ग्राहक", colIssued: "जारी", colPending: "बाकी",
    colAmount: "राशि (₹)", colStatus: "स्थिति",
    statusIssued: "जारी", statusPartial: "आंशिक", statusClosed: "बंद", statusReturned: "वापस",
  },
  en: {
    title: "Rental Entries",
    today: "Today", week: "This Week", month: "This Month",
    categoryLabel: "Category", all: "All", bartan: "Bartan", bichayat: "Bichayat",
    from: "From", to: "To",
    colReceipt: "Receipt", colDate: "Date", colCategory: "Category",
    colCustomer: "Customer", colIssued: "Issued", colPending: "Pending",
    colAmount: "Amount (₹)", colStatus: "Status",
    statusIssued: "Issued", statusPartial: "Partial", statusClosed: "Closed", statusReturned: "Returned",
  },
};

export default function MyRentalEntriesPage() {
  const { auth, language } = useAuth();
  const t = L[language] ?? L.en;
  const navigate = useNavigate();

  const STATUS_LABEL = {
    ISSUED: t.statusIssued,
    PARTIALLY_RETURNED: t.statusPartial,
    CLOSED: t.statusClosed,
    RETURNED: t.statusReturned,
  };

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
    getMyRentalEntries({ createdBy: auth.username, ...filters, category })
      .then((r) => setRows(r.data.map((x, i) => ({ id: i, ...x }))))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [filters, category]);

  const columns = [
    { field: "receiptNumber", headerName: t.colReceipt, flex: 1.2, minWidth: 160 },
    {
      field: "createdAt", headerName: t.colDate, flex: 1, minWidth: 110,
      renderCell: (p) => fmtDate(p.value)
    },
    {
      field: "category", headerName: t.colCategory, width: 100,
      renderCell: (p) => (
        <Chip label={p.value === "BARTAN" ? t.bartan : t.bichayat} size="small"
          color={p.value === "BARTAN" ? "primary" : "secondary"} variant="outlined" />
      )
    },
    { field: "customerName", headerName: t.colCustomer, flex: 1, minWidth: 120 },
    { field: "totalIssuedQty",  headerName: t.colIssued,  width: 70, align: "center", headerAlign: "center" },
    { field: "totalPendingQty", headerName: t.colPending, width: 70, align: "center", headerAlign: "center" },
    {
      field: "chargedAmount", headerName: t.colAmount, width: 90, align: "right", headerAlign: "right",
      renderCell: (p) => `₹ ${p.value ?? 0}`
    },
    {
      field: "status", headerName: t.colStatus, width: 110,
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
        <Typography variant="h5" fontWeight={600}>{t.title}</Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", mb: 2 }}>
        <Stack direction="row" spacing={1}>
          {[["today", t.today], ["week", t.week], ["month", t.month]].map(([key, label]) => (
            <Button key={key} size="small"
              variant={preset === key ? "contained" : "outlined"}
              onClick={() => applyPreset(key)}
            >{label}</Button>
          ))}
        </Stack>

        <TextField
          select size="small" label={t.categoryLabel}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="">{t.all}</MenuItem>
          <MenuItem value="BARTAN">{t.bartan}</MenuItem>
          <MenuItem value="BICHAYAT">{t.bichayat}</MenuItem>
        </TextField>

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

      <Box sx={{ height: 520 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          onRowClick={(p) => navigate(`/rentals/view/${p.row.receiptNumber}`)}
          sx={{ cursor: "pointer", "& .MuiDataGrid-row:hover": { bgcolor: "action.hover" } }}
        />
      </Box>
    </Box>
  );
}
