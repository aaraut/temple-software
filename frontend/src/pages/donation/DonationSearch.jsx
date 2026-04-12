import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useAuth } from "../../context/AuthContext";
import {
  searchDonations,
  printDonation,
  changeDonationStatus
} from "../../api/donationApi";
import { useNavigate } from "react-router-dom";

// Safely format amount — handles BigDecimal string or number
const formatAmount = (v) => {
  const n = Number(v ?? 0);
  return `₹ ${isNaN(n) ? "0" : n.toLocaleString("en-IN")}`;
};

// Safely format date — handles Java LocalDateTime array [y,m,d,h,min,s,nano]
const formatDate = (v) => {
  if (!v) return "";
  if (Array.isArray(v)) {
    const [year, month, day, hour = 0, min = 0, sec = 0] = v;
    return new Date(year, month - 1, day, hour, min, sec).toLocaleString("en-IN");
  }
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toLocaleString("en-IN");
};

export default function DonationSearch() {
  const { auth, language } = useAuth();
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [rows, setRows] = useState([]);

  const isAdmin = auth.role === "ADMIN";

  const L = {
    hi: {
      title: "पिछले दान खोजें",
      mobile: "मोबाइल नंबर",
      donorName: "दानकर्ता का नाम",
      search: "खोजें",
      receipt: "रसीद क्रमांक",
      name: "नाम",
      mobileCol: "मोबाइल",
      purpose: "उद्देश्य",
      amount: "राशि",
      date: "दिनांक",
      actions: "कार्रवाई",
      view: "अधिक जानकारी",
      print: "प्रिंट",
      update: "अपडेट",
      disable: "डिलीट",
    },
    en: {
      title: "Search Past Donations",
      mobile: "Mobile Number",
      donorName: "Donor Name",
      search: "Search",
      receipt: "Receipt",
      name: "Name",
      mobileCol: "Mobile",
      purpose: "Purpose",
      amount: "Amount",
      date: "Date",
      actions: "Actions",
      view: "View",
      print: "Print",
      update: "Update",
      disable: "Disable",
    },
  };
  const t = L[language] ?? L.en;

  const handleSearch = async () => {
    const res = await searchDonations({
      mobile,
      donorName: name
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

  const columns = [
    { field: "receiptNumber", headerName: t.receipt, width: 150 },
    { field: "donorName",     headerName: t.name,    width: 200 },
    { field: "mobile",        headerName: t.mobileCol, width: 140 },
    {
      field: "purposeNameEn",
      headerName: t.purpose,
      width: 180,
      // Show Hindi purpose name when in Hindi mode
      valueGetter: (value, row) =>
        language === "hi" ? (row.purposeNameHi || value) : value,
    },
    {
      field: "amount",
      headerName: t.amount,
      width: 120,
      valueFormatter: (value) => formatAmount(value),
    },
    {
      field: "createdAt",
      headerName: t.date,
      width: 200,
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
            onClick={() =>
              navigate(`/donation/edit/${params.row.id}?mode=view`)
            }
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
                onClick={() =>
                  navigate(`/donation/edit/${params.row.id}`)
                }
              >
                {t.update}
              </Button>

              <Button
                size="small"
                color="error"
                onClick={() =>
                  changeDonationStatus(params.row.id, false, auth.username)
                }
              >
                {t.disable}
              </Button>
            </>
          )}
        </Stack>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" mb={2}>
        {t.title}
      </Typography>

      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          label={t.mobile}
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />

        <TextField
          label={t.donorName}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Button variant="contained" onClick={handleSearch}>
          {t.search}
        </Button>
      </Stack>

      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        autoHeight
        pageSizeOptions={[10, 20, 50]}
      />
    </Box>
  );
}
