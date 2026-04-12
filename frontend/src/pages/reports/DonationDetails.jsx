import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  searchDonations,
  printDonation,
  changeDonationStatus,
} from "../../api/donationApi";

// Safely format date — handles Java LocalDateTime array [y,m,d,h,min,s,nano]
// and ISO strings, returns "Invalid Date" never
const formatDate = (v) => {
  if (!v) return "";
  if (Array.isArray(v)) {
    const [year, month, day, hour = 0, min = 0, sec = 0] = v;
    const d = new Date(year, month - 1, day, hour, min, sec);
    return d.toLocaleString("en-IN");
  }
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toLocaleString("en-IN");
};

// Safely format amount — handles BigDecimal string or number
const formatAmount = (v) => {
  const n = Number(v ?? 0);
  return `₹ ${isNaN(n) ? "0" : n.toLocaleString("en-IN")}`;
};

export default function DonationDetails() {
  const { auth, language } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const purpose = params.get("purpose");
  const period = params.get("period");
  const selectedUser = params.get("user");

  const [rows, setRows] = useState([]);
  const [confirmId, setConfirmId] = useState(null);

  const isAdmin = auth?.role === "ADMIN";

  const L = {
    hi: {
      title: "रसीद विवरण",
      receipt: "रसीद क्रमांक",
      donor: "दानकर्ता",
      mobile: "मोबाइल",
      amount: "राशि",
      date: "दिनांक",
      actions: "कार्रवाई",
      view: "अधिक जानकारी",
      print: "प्रिंट",
      update: "अपडेट",
      disable: "डिलीट",
      confirmTitle: "डिलीट की पुष्टि करें",
      confirmMsg: "क्या आप इस दान को डिलीट करना चाहते हैं?",
      cancel: "रद्द करें",
      confirm: "हाँ, डिलीट करें",
    },
    en: {
      title: "Receipt Details",
      receipt: "Receipt",
      donor: "Donor",
      mobile: "Mobile",
      amount: "Amount",
      date: "Date",
      actions: "Actions",
      view: "View",
      print: "Print",
      update: "Update",
      disable: "Disable",
      confirmTitle: "Confirm Disable",
      confirmMsg: "क्या आप इस दान को डिलीट करना चाहते हैं?",
      cancel: "Cancel",
      confirm: "Confirm",
    },
  };
  const t = L[language] ?? L.en;

  useEffect(() => {
    loadData();
  }, []);

  const getDateRange = () => {
    const now = new Date();

    if (period === "DAILY") {
      return { fromDate: now, toDate: now };
    }

    if (period === "WEEKLY") {
      const start = new Date();
      start.setDate(now.getDate() - 7);
      return { fromDate: start, toDate: now };
    }

    if (period === "MONTHLY") {
      const start = new Date();
      start.setMonth(now.getMonth() - 1);
      return { fromDate: start, toDate: now };
    }

    return { fromDate: now, toDate: now };
  };

  const loadData = async () => {
    const range = getDateRange();

    const res = await searchDonations({
      purposeNameEn: purpose,
      createdBy: selectedUser,
      fromDate: range.fromDate,
      toDate: range.toDate,
    });

    setRows(res.data);
  };

  const handlePrint = async (row) => {
    const response = await printDonation(row.id);
    const url = window.URL.createObjectURL(
      new Blob([response.data], { type: "application/pdf" })
    );
    window.open(url);
  };

  // Fix 1: pass auth.username to changeDonationStatus
  const handleDisable = async (id) => {
    await changeDonationStatus(id, false, auth.username);
    loadData();
  };

  const handleUpdate = (row) => {
    navigate(`/donation/edit/${row.id}`);
  };

  const columns = [
    { field: "receiptNumber", headerName: t.receipt, width: 150 },
    { field: "donorName", headerName: t.donor, width: 200 },
    { field: "mobile", headerName: t.mobile, width: 140 },
    {
      field: "amount",
      headerName: t.amount,
      width: 120,
      // Fix 2: NaN — MUI v6 valueFormatter receives value directly, not params.value
      valueFormatter: (value) => formatAmount(value),
    },
    {
      field: "createdAt",
      headerName: t.date,
      width: 200,
      // Fix 3: Invalid Date — Java LocalDateTime serializes as array
      valueFormatter: (value) => formatDate(value),
    },
    {
      field: "actions",
      headerName: t.actions,
      width: 300,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            onClick={() => navigate(`/donation/edit/${params.row.id}?mode=view`)}
          >
            {t.view}
          </Button>

          <Button
            size="small"
            onClick={() => handlePrint(params.row)}
          >
            {t.print}
          </Button>

          {isAdmin && (
            <>
              <Button
                size="small"
                onClick={() => handleUpdate(params.row)}
              >
                {t.update}
              </Button>

              <Button
                size="small"
                color="error"
                onClick={() => setConfirmId(params.row.id)}
              >
                {t.disable}
              </Button>
            </>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" mb={2}>
          {purpose} - {t.title}
        </Typography>

        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          autoHeight
          pageSizeOptions={[10, 20, 50]}
        />
      </Box>

      <Dialog open={!!confirmId} onClose={() => setConfirmId(null)}>
        <DialogTitle>{t.confirmTitle}</DialogTitle>
        <DialogContent>
          {t.confirmMsg}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmId(null)}>{t.cancel}</Button>
          <Button
            color="error"
            onClick={async () => {
              // Fix 1 (dialog): pass auth.username here too
              await changeDonationStatus(confirmId, false, auth.username);
              setConfirmId(null);
              loadData();
            }}
          >
            {t.confirm}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
